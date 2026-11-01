import { Inject, Injectable } from "@nestjs/common";
import { DataSource, MoreThan, LessThan } from "typeorm";
import { User, Session } from "../model/entities";
@Injectable()
export class AuthRepository {
  constructor(@Inject(DataSource) private readonly db: DataSource) {}
  byEmail(email: string) {
    return this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.email=:email AND u.active=true", { email })
      .getOne();
  }
  async session(hash: string) {
    const s = await this.db
      .getRepository(Session)
      .findOne({ where: { tokenHash: hash, expiresAt: MoreThan(new Date()) } });
    if (!s) return null;
    const user = await this.db
      .getRepository(User)
      .findOne({ where: { id: s.userId, active: true } });
    return user ? { user, session: s } : null;
  }
  async createSession(userId: string, hash: string) {
    const repo = this.db.getRepository(Session);
    await repo.delete({ expiresAt: LessThan(new Date()) });
    return repo.save(
      repo.create({
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 8 * 3600000),
      }),
    );
  }
  revoke(hash: string) {
    return this.db.getRepository(Session).delete({ tokenHash: hash });
  }
}
