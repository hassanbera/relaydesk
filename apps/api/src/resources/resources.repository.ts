import { Inject, Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  Asset,
  Article,
  Catalog,
  Team,
  User,
  SlaPolicy,
  Change,
  AuditEvent,
} from "../model/entities";
@Injectable()
export class ResourcesRepository {
  constructor(@Inject(DataSource) readonly db: DataSource) {}
  assets(user: User) {
    const q = this.db
      .getRepository(Asset)
      .createQueryBuilder("a")
      .leftJoinAndMapOne("a.owner", User, "u", 'u.id=a."ownerId"');
    if (user.role === "REQUESTER") q.where('a."ownerId"=:me', { me: user.id });
    return q
      .orderBy("a.createdAt", "DESC")
      .getMany()
      .then((rows) =>
        rows.map((a) => {
          const { owner, ...row } = a as Asset & { owner?: User };
          return { ...row, ownerName: owner?.name || null };
        }),
      );
  }
  articles(user: User) {
    const q = this.db
      .getRepository(Article)
      .createQueryBuilder("a")
      .leftJoinAndMapOne("a.author", User, "u", 'u.id=a."authorId"');
    if (user.role === "REQUESTER") q.where("a.published=true");
    return q
      .orderBy("a.updatedAt", "DESC")
      .getMany()
      .then((rows) =>
        rows.map((a) => {
          const { author, ...row } = a as Article & { author: User };
          return { ...row, authorName: author?.name };
        }),
      );
  }
  async reference(user: User) {
    const [teams, catalog, assets, agents] = await Promise.all([
      this.db.getRepository(Team).find({ order: { name: "ASC" } }),
      this.db
        .getRepository(Catalog)
        .find({ where: { active: true }, order: { name: "ASC" } }),
      this.assets(user),
      user.role === "REQUESTER"
        ? Promise.resolve([])
        : this.db
            .getRepository(User)
            .find({ where: { active: true }, order: { name: "ASC" } }),
    ]);
    return { teams, catalog, assets, agents };
  }
  async settings() {
    const [users, teams, policies, catalog] = await Promise.all([
      this.db.getRepository(User).find({ order: { name: "ASC" } }),
      this.db.getRepository(Team).find({ order: { name: "ASC" } }),
      this.db.getRepository(SlaPolicy).find({ order: { priority: "ASC" } }),
      this.db.getRepository(Catalog).find({ order: { name: "ASC" } }),
    ]);
    return { users, teams, policies, catalog };
  }
  changes() {
    return this.db
      .getRepository(Change)
      .createQueryBuilder("c")
      .leftJoinAndMapOne("c.requester", User, "u", 'u.id=c."requesterId"')
      .orderBy("c.createdAt", "DESC")
      .getMany()
      .then((rows) =>
        rows.map((c) => {
          const { requester, ...row } = c as Change & { requester: User };
          return {
            ...row,
            requesterName: requester?.name || "",
            code: `CHG-${String(c.number).padStart(5, "0")}`,
          };
        }),
      );
  }
  history(type: string, id: string) {
    return this.db
      .getRepository(AuditEvent)
      .createQueryBuilder("a")
      .leftJoinAndMapOne("a.actor", User, "u", 'u.id=a."actorId"')
      .where('a."entityType"=:type AND a."entityId"=:id', { type, id })
      .orderBy("a.createdAt", "DESC")
      .getMany()
      .then((rows) =>
        rows.map((a) => {
          const { actor, ...row } = a as AuditEvent & { actor: User };
          return { ...row, actorName: actor?.name };
        }),
      );
  }
}
