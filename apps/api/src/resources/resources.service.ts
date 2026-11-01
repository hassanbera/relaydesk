import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssetInput,
  ArticleInput,
  ChangeInput,
  changeStatuses,
} from "@relaydesk/contracts";
import {
  Asset,
  Article,
  User,
  Team,
  Catalog,
  SlaPolicy,
  Change,
  Session,
} from "../model/entities";
import { ResourcesRepository } from "./resources.repository";
import { audit } from "../common/audit";
import { hashPassword } from "../auth/password";
@Injectable()
export class ResourcesService {
  constructor(
    @Inject(ResourcesRepository) private readonly repo: ResourcesRepository,
  ) {}
  reference(u: User) {
    return this.repo.reference(u);
  }
  settings() {
    return this.repo.settings();
  }
  assets(u: User) {
    return this.repo.assets(u);
  }
  articles(u: User) {
    return this.repo.articles(u);
  }
  changes() {
    return this.repo.changes();
  }
  private admin(u: User) {
    if (u.role !== "ADMIN")
      throw new ForbiddenException("Yönetici yetkisi gerekli.");
  }
  private staff(u: User) {
    if (u.role === "REQUESTER")
      throw new ForbiddenException("Destek ekibi yetkisi gerekli.");
  }
  async saveAsset(u: User, input: AssetInput, id?: string, version?: number) {
    this.staff(u);
    return this.repo.db.transaction(async (m) => {
      const r = m.getRepository(Asset);
      const current = id
        ? await r.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
          })
        : null;
      if (id && !current) throw new NotFoundException("Varlık bulunamadı.");
      if (current && current.version !== version)
        throw new ConflictException("Varlık güncellendi. Listeyi yenileyin.");
      if (
        input.ownerId &&
        !(await m
          .getRepository(User)
          .existsBy({ id: input.ownerId, active: true }))
      )
        throw new BadRequestException("Aktif bir kullanıcı seçin.");
      if (["RETIRED", "AVAILABLE"].includes(input.status) && input.ownerId)
        throw new BadRequestException(
          "Kullanım dışı veya boş varlıkta kullanıcı ataması olamaz.",
        );
      const a = await r.save(
        r.create({
          ...current,
          ...input,
          version: current ? current.version + 1 : 1,
        }),
      );
      await audit(m, u.id, "asset", a.id, current ? "UPDATED" : "CREATED", {
        status: a.status,
        ownerId: a.ownerId,
      });
      return a;
    });
  }
  async saveArticle(
    u: User,
    input: ArticleInput,
    id?: string,
    version?: number,
  ) {
    this.staff(u);
    return this.repo.db.transaction(async (m) => {
      const r = m.getRepository(Article);
      const current = id
        ? await r.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
          })
        : null;
      if (id && !current) throw new NotFoundException("Makale bulunamadı.");
      if (current && current.version !== version)
        throw new ConflictException("Makale güncellendi. Listeyi yenileyin.");
      const article = await r.save(
        r.create({
          ...current,
          ...input,
          authorId: current?.authorId || u.id,
          version: current ? current.version + 1 : 1,
        }),
      );
      await audit(
        m,
        u.id,
        "article",
        article.id,
        current ? "UPDATED" : "CREATED",
        { published: article.published },
      );
      return article;
    });
  }
  async saveChange(u: User, input: ChangeInput, id?: string, version?: number) {
    this.staff(u);
    return this.repo.db.transaction(async (m) => {
      const r = m.getRepository(Change);
      const current = id
        ? await r.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
          })
        : null;
      if (id && !current) throw new NotFoundException("Değişiklik bulunamadı.");
      if (
        current &&
        (current.version !== version ||
          !["DRAFT", "REJECTED"].includes(current.status))
      )
        throw new ConflictException(
          "Yalnız güncel taslak veya reddedilen değişiklik düzenlenebilir.",
        );
      if (current && current.requesterId !== u.id && u.role !== "ADMIN")
        throw new ForbiddenException("Bu değişikliği düzenleyemezsiniz.");
      if (
        input.assetId &&
        !(await m.getRepository(Asset).existsBy({ id: input.assetId }))
      )
        throw new BadRequestException("Varlık bulunamadı.");
      const c = await r.save(
        r.create({
          ...current,
          ...input,
          plannedStart: new Date(input.plannedStart),
          plannedEnd: new Date(input.plannedEnd),
          requesterId: current?.requesterId || u.id,
          status: "DRAFT",
          version: current ? current.version + 1 : 1,
          approverId: null,
          approvedAt: null,
          decisionNote: "",
        }),
      );
      await audit(m, u.id, "change", c.id, current ? "UPDATED" : "CREATED", {
        risk: c.risk,
      });
      return c;
    });
  }
  async changeDetail(id: string) {
    const c = (await this.repo.changes()).find((c) => c.id === id);
    if (!c) throw new NotFoundException("Değişiklik bulunamadı.");
    return { ...c, history: await this.repo.history("change", id) };
  }
  async transition(
    u: User,
    id: string,
    version: number,
    status: (typeof changeStatuses)[number],
    note: string,
  ) {
    this.staff(u);
    await this.repo.db.transaction(async (m) => {
      const r = m.getRepository(Change);
      const c = await r.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!c) throw new NotFoundException("Değişiklik bulunamadı.");
      if (c.version !== version)
        throw new ConflictException(
          "Değişiklik güncellendi. Sayfayı yenileyin.",
        );
      const allowed: Record<string, string[]> = {
        DRAFT: ["PENDING_APPROVAL"],
        REJECTED: ["DRAFT"],
        PENDING_APPROVAL: ["APPROVED", "REJECTED"],
        APPROVED: ["SCHEDULED"],
        SCHEDULED: ["IMPLEMENTED", "FAILED"],
        IMPLEMENTED: [],
        FAILED: [],
      };
      if (!allowed[c.status]?.includes(status))
        throw new ConflictException("Bu durum geçişine izin verilmiyor.");
      if (["APPROVED", "REJECTED"].includes(status)) {
        if (u.role !== "ADMIN" || u.id === c.requesterId)
          throw new ForbiddenException("Başka bir yönetici onayı gerekli.");
        if (status === "REJECTED" && !note.trim())
          throw new BadRequestException("Ret gerekçesi gerekli.");
        c.approverId = u.id;
        c.approvedAt = status === "APPROVED" ? new Date() : null;
      } else if (u.id !== c.requesterId && u.role !== "ADMIN")
        throw new ForbiddenException("Bu değişikliği ilerletemezsiniz.");
      if (["IMPLEMENTED", "FAILED"].includes(status) && !note.trim())
        throw new BadRequestException("Uygulama sonucu gerekli.");
      const before = c.status;
      c.status = status;
      c.decisionNote = note;
      c.version++;
      await r.save(c);
      await audit(m, u.id, "change", id, "STATUS_CHANGED", {
        before,
        after: status,
        note,
      });
    });
    return this.changeDetail(id);
  }
  async createUser(
    u: User,
    input: {
      name: string;
      email: string;
      role: User["role"];
      teamId: string | null;
      password: string;
    },
  ) {
    this.admin(u);
    return this.repo.db.transaction(async (m) => {
      if (
        input.teamId &&
        !(await m.getRepository(Team).existsBy({ id: input.teamId }))
      )
        throw new BadRequestException("Ekip bulunamadı.");
      const r = m.getRepository(User);
      const { password, ...data } = input;
      const v = await r.save(
        r.create({
          ...data,
          active: true,
          passwordHash: await hashPassword(password),
        }),
      );
      await audit(m, u.id, "user", v.id, "CREATED", { role: v.role });
      const { passwordHash: _, ...safe } = v;
      return safe;
    });
  }
  async updateUser(
    u: User,
    id: string,
    input: {
      name: string;
      role: User["role"];
      teamId: string | null;
      active: boolean;
    },
  ) {
    this.admin(u);
    return this.repo.db.transaction("SERIALIZABLE", async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(537913021)");
      const r = m.getRepository(User);
      const actor = await r.findOneBy({
        id: u.id,
        active: true,
        role: "ADMIN",
      });
      if (!actor)
        throw new ForbiddenException(
          "Yönetici erişiminiz artık geçerli değil.",
        );
      const v = await r.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!v) throw new NotFoundException("Kullanıcı bulunamadı.");
      if (u.id === id && (input.role !== "ADMIN" || !input.active))
        throw new ConflictException(
          "Kendi yönetici erişiminizi kaldıramazsınız.",
        );
      if (
        v.role === "ADMIN" &&
        v.active &&
        (input.role !== "ADMIN" || !input.active) &&
        (await r.countBy({ role: "ADMIN", active: true })) <= 1
      )
        throw new ConflictException("En az bir aktif yönetici kalmalı.");
      if (
        input.teamId &&
        !(await m.getRepository(Team).existsBy({ id: input.teamId }))
      )
        throw new BadRequestException("Ekip bulunamadı.");
      Object.assign(v, input);
      await r.save(v);
      if (!input.active) await m.getRepository(Session).delete({ userId: id });
      await audit(m, u.id, "user", id, "UPDATED", {
        role: v.role,
        active: v.active,
      });
      return v;
    });
  }
  async saveTeam(
    u: User,
    input: { name: string; description: string },
    id?: string,
  ) {
    this.admin(u);
    return this.repo.db.transaction(async (m) => {
      const r = m.getRepository(Team);
      if (id && !(await r.existsBy({ id })))
        throw new NotFoundException("Ekip bulunamadı.");
      const v = await r.save(r.create({ ...input, ...(id ? { id } : {}) }));
      await audit(m, u.id, "team", v.id, id ? "UPDATED" : "CREATED", {});
      return v;
    });
  }
  async saveCatalog(
    u: User,
    input: {
      name: string;
      description: string;
      category: string;
      teamId: string;
      active: boolean;
    },
    id?: string,
  ) {
    this.admin(u);
    return this.repo.db.transaction(async (m) => {
      if (!(await m.getRepository(Team).existsBy({ id: input.teamId })))
        throw new BadRequestException("Ekip bulunamadı.");
      const r = m.getRepository(Catalog);
      if (id && !(await r.existsBy({ id })))
        throw new NotFoundException("Hizmet bulunamadı.");
      const v = await r.save(r.create({ ...input, ...(id ? { id } : {}) }));
      await audit(m, u.id, "catalog", v.id, id ? "UPDATED" : "CREATED", {});
      return v;
    });
  }
  async policy(
    u: User,
    id: string,
    input: { responseMinutes: number; resolutionMinutes: number },
  ) {
    this.admin(u);
    return this.repo.db.transaction(async (m) => {
      const r = m.getRepository(SlaPolicy);
      const v = await r.findOneBy({ id });
      if (!v) throw new NotFoundException("SLA bulunamadı.");
      Object.assign(v, input);
      await r.save(v);
      await audit(m, u.id, "policy", id, "UPDATED", input);
      return v;
    });
  }
}
