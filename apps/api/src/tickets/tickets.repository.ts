import { Inject, Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  Ticket,
  User,
  Team,
  Asset,
  Comment,
  AuditEvent,
} from "../model/entities";
import type { TicketFilters } from "@relaydesk/contracts";
import { slaState, breachSql, riskSql } from "./rules";
type JoinedTicket = Ticket & {
  requester: User;
  team?: Team;
  assignee?: User;
  asset?: Asset;
};
@Injectable()
export class TicketsRepository {
  constructor(@Inject(DataSource) readonly db: DataSource) {}
  scope(user: User, manager: EntityManager = this.db.manager) {
    const q = manager.getRepository(Ticket).createQueryBuilder("t");
    if (user.role === "REQUESTER")
      q.where('t."requesterId"=:actor', { actor: user.id });
    return q;
  }
  joined(user: User) {
    return this.scope(user)
      .leftJoinAndMapOne(
        "t.requester",
        User,
        "requester",
        'requester.id=t."requesterId"',
      )
      .leftJoinAndMapOne("t.team", Team, "team", 'team.id=t."teamId"')
      .leftJoinAndMapOne(
        "t.assignee",
        User,
        "assignee",
        'assignee.id=t."assigneeId"',
      )
      .leftJoinAndMapOne("t.asset", Asset, "asset", 'asset.id=t."assetId"');
  }
  view(value: Ticket) {
    const t = value as JoinedTicket;
    const { requester, team, assignee, asset, ...fields } = t;
    return {
      ...fields,
      code: `${t.type === "INCIDENT" ? "INC" : "REQ"}-${String(t.number).padStart(5, "0")}`,
      requesterName: requester?.name || "",
      teamName: team?.name || null,
      assigneeName: assignee?.name || null,
      assetName: asset?.name || null,
      slaState: slaState(t),
    };
  }
  async list(user: User, f: TicketFilters) {
    const q = this.joined(user);
    if (f.q) {
      const needle = f.q
        .replace(/^(INC|REQ)-0*/i, "")
        .replace(/[\\%_]/g, "\\$&");
      q.andWhere(
        "(t.title ILIKE :q OR CAST(t.number AS text) ILIKE :q OR requester.name ILIKE :q)",
        { q: `%${needle}%` },
      );
    }
    if (f.status) q.andWhere("t.status=:status", { status: f.status });
    if (f.priority)
      q.andWhere("t.priority=:priority", { priority: f.priority });
    if (f.type) q.andWhere("t.type=:type", { type: f.type });
    if (f.mine === "true") q.andWhere('t."assigneeId"=:me', { me: user.id });
    if (f.sla === "breached")
      q.andWhere(breachSql).andWhere("t.status NOT IN ('RESOLVED','CLOSED')");
    if (f.sla === "risk") q.andWhere(riskSql);
    if (f.sort === "priority")
      q.orderBy("t.priority", "ASC").addOrderBy("t.createdAt", "ASC");
    else
      q.orderBy(
        f.sort === "oldest" ? "t.createdAt" : "t.updatedAt",
        f.sort === "oldest" ? "ASC" : "DESC",
      );
    q.addOrderBy("t.id", "ASC");
    const [items, total] = await q
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .getManyAndCount();
    return {
      items: items.map((t) => this.view(t)),
      total,
      page: f.page,
      limit: f.limit,
    };
  }
  async detail(user: User, id: string) {
    const t = await this.joined(user).andWhere("t.id=:id", { id }).getOne();
    if (!t) return null;
    const comments = await this.db
      .getRepository(Comment)
      .createQueryBuilder("c")
      .leftJoinAndMapOne("c.author", User, "u", 'u.id=c."authorId"')
      .where('c."ticketId"=:id', { id })
      .andWhere(user.role === "REQUESTER" ? "c.internal=false" : "true")
      .orderBy("c.createdAt", "ASC")
      .getMany();
    const history =
      user.role === "REQUESTER"
        ? []
        : await this.db
            .getRepository(AuditEvent)
            .createQueryBuilder("a")
            .leftJoinAndMapOne("a.actor", User, "u", 'u.id=a."actorId"')
            .where('a."entityType"=:type AND a."entityId"=:id', {
              type: "ticket",
              id,
            })
            .orderBy("a.createdAt", "DESC")
            .getMany();
    return {
      ...this.view(t),
      comments: comments.map((c) => {
        const { author, ...row } = c as Comment & { author: User };
        return { ...row, authorName: author?.name || "" };
      }),
      history: history.map((a) => {
        const { actor, ...row } = a as AuditEvent & { actor: User };
        return { ...row, actorName: actor?.name || "" };
      }),
    };
  }
}
