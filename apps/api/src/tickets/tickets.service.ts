import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import {
  priorityFor,
  TicketCreate,
  TicketUpdate,
  TicketFilters,
} from "@relaydesk/contracts";
import {
  Asset,
  Catalog,
  Comment,
  SlaPolicy,
  Team,
  Ticket,
  User,
} from "../model/entities";
import { TicketsRepository } from "./tickets.repository";
import { audit } from "../common/audit";
import { transitions } from "./rules";
@Injectable()
export class TicketsService {
  constructor(
    @Inject(TicketsRepository) private readonly repo: TicketsRepository,
  ) {}
  list(user: User, f: TicketFilters) {
    return this.repo.list(user, f);
  }
  async detail(user: User, id: string) {
    const t = await this.repo.detail(user, id);
    if (!t) throw new NotFoundException("Talep bulunamadı.");
    return t;
  }
  private async readable(m: EntityManager, user: User, id: string) {
    const t = await this.repo
      .scope(user, m)
      .andWhere("t.id=:id", { id })
      .setLock("pessimistic_write")
      .getOne();
    if (!t) throw new NotFoundException("Talep bulunamadı.");
    return t;
  }
  private async assignment(
    m: EntityManager,
    teamId: string | null,
    assigneeId: string | null,
  ) {
    if (teamId && !(await m.getRepository(Team).existsBy({ id: teamId })))
      throw new BadRequestException("Ekip bulunamadı.");
    if (assigneeId) {
      const u = await m
        .getRepository(User)
        .findOneBy({ id: assigneeId, active: true });
      if (!u || u.role === "REQUESTER" || u.teamId !== teamId)
        throw new BadRequestException(
          "Görevli, seçili ekibin aktif bir destek uzmanı olmalı.",
        );
    }
  }
  async create(user: User, input: TicketCreate) {
    const created = await this.repo.db.transaction(async (m) => {
      if (user.role === "REQUESTER" && (input.teamId || input.assigneeId))
        throw new ForbiddenException("Ekip ve görevli atama yetkiniz yok.");
      const catalog = input.catalogId
        ? await m
            .getRepository(Catalog)
            .findOneBy({ id: input.catalogId, active: true })
        : null;
      if (input.catalogId && !catalog)
        throw new BadRequestException("Hizmet bulunamadı.");
      if (input.type === "REQUEST" && !catalog)
        throw new BadRequestException(
          "Hizmet talepleri için katalogdan bir hizmet seçin.",
        );
      if (input.assetId) {
        const asset = await m
          .getRepository(Asset)
          .findOneBy({ id: input.assetId });
        if (
          !asset ||
          asset.status === "RETIRED" ||
          (user.role === "REQUESTER" && asset.ownerId !== user.id)
        )
          throw new BadRequestException("Bu varlık seçilemez.");
      }
      const priority = priorityFor(input.impact, input.urgency);
      const policy = await m
        .getRepository(SlaPolicy)
        .findOneByOrFail({ priority });
      const teamId = input.teamId || catalog?.teamId || null;
      const assigneeId = input.assigneeId || null;
      await this.assignment(m, teamId, assigneeId);
      const now = Date.now();
      const r = m.getRepository(Ticket);
      const t = await r.save(
        r.create({
          ...input,
          priority,
          category: catalog?.category || "Genel",
          teamId,
          assigneeId,
          requesterId: user.id,
          catalogId: catalog?.id || null,
          assetId: input.assetId || null,
          status: "NEW",
          pausedMs: 0,
          firstResponseAt: null,
          resolvedAt: null,
          pausedAt: null,
          resolution: "",
          responseDueAt: new Date(now + policy.responseMinutes * 60000),
          resolutionDueAt: new Date(now + policy.resolutionMinutes * 60000),
        }),
      );
      await audit(m, user.id, "ticket", t.id, "CREATED", {
        type: t.type,
        priority: t.priority,
      });
      return t;
    });
    return this.detail(user, created.id);
  }
  async update(user: User, id: string, input: TicketUpdate) {
    if (user.role === "REQUESTER")
      throw new ForbiddenException(
        "Talebi yalnız destek ekibi güncelleyebilir.",
      );
    await this.repo.db.transaction(async (m) => {
      const t = await this.readable(m, user, id);
      if (t.version !== input.version)
        throw new ConflictException(
          "Talep başka biri tarafından güncellendi. Sayfayı yenileyin.",
        );
      if (t.status === "CLOSED")
        throw new ConflictException("Kapanan talep değiştirilemez.");
      const next = input.status || t.status;
      if (next !== t.status && !transitions[t.status].includes(next))
        throw new ConflictException("Bu durum geçişine izin verilmiyor.");
      if (
        next === "RESOLVED" &&
        t.status !== "RESOLVED" &&
        !input.resolution?.trim()
      )
        throw new BadRequestException("Çözüm açıklaması gerekli.");
      const previous = {
        status: t.status,
        priority: t.priority,
        teamId: t.teamId,
        assigneeId: t.assigneeId,
      };
      const now = new Date();
      if (t.pausedAt && next !== "PENDING") {
        const paused = +now - +t.pausedAt;
        t.pausedMs += paused;
        t.resolutionDueAt = new Date(+t.resolutionDueAt + paused);
        t.pausedAt = null;
      }
      if (next === "PENDING" && t.status !== "PENDING") t.pausedAt = now;
      if (!t.firstResponseAt && next !== "NEW") t.firstResponseAt = now;
      if (next === "RESOLVED" && t.status !== "RESOLVED") t.resolvedAt = now;
      if (next === "IN_PROGRESS" && t.status === "RESOLVED")
        t.resolvedAt = null;
      for (const key of [
        "title",
        "description",
        "impact",
        "urgency",
        "teamId",
        "assigneeId",
        "resolution",
      ] as const)
        if (input[key] !== undefined)
          (t as unknown as Record<string, unknown>)[key] = input[key];
      await this.assignment(m, t.teamId, t.assigneeId);
      const priority = priorityFor(
        t.impact as "LOW" | "MEDIUM" | "HIGH",
        t.urgency as "LOW" | "MEDIUM" | "HIGH",
      );
      if (priority !== t.priority) {
        const policy = await m
          .getRepository(SlaPolicy)
          .findOneByOrFail({ priority });
        t.priority = priority;
        t.responseDueAt = new Date(
          +t.createdAt + policy.responseMinutes * 60000,
        );
        t.resolutionDueAt = new Date(
          +t.createdAt + policy.resolutionMinutes * 60000 + t.pausedMs,
        );
      }
      t.status = next;
      t.version++;
      await m.getRepository(Ticket).save(t);
      await audit(m, user.id, "ticket", id, "UPDATED", {
        before: previous,
        after: {
          status: t.status,
          priority: t.priority,
          teamId: t.teamId,
          assigneeId: t.assigneeId,
        },
      });
    });
    return this.detail(user, id);
  }
  async comment(user: User, id: string, body: string, internal: boolean) {
    if (internal && user.role === "REQUESTER")
      throw new ForbiddenException("İç not ekleyemezsiniz.");
    await this.repo.db.transaction(async (m) => {
      const t = await this.readable(m, user, id);
      if (t.status === "CLOSED")
        throw new ConflictException("Kapanan talebe yorum eklenemez.");
      const repo = m.getRepository(Comment);
      await repo.save(
        repo.create({ ticketId: id, authorId: user.id, body, internal }),
      );
      if (user.role !== "REQUESTER" && !internal && !t.firstResponseAt) {
        t.firstResponseAt = new Date();
        t.version++;
        await m.getRepository(Ticket).save(t);
      }
      await audit(
        m,
        user.id,
        "ticket",
        id,
        internal ? "INTERNAL_NOTE" : "COMMENTED",
        {},
      );
    });
    return this.detail(user, id);
  }
}
