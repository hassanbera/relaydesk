import {
  Inject,
  Injectable,
  UnauthorizedException,
  HttpException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { AuthRepository } from "./auth.repository";
import { verifyPassword, tokenHash } from "./password";
@Injectable()
export class AuthService {
  private readonly attempts = new Map<
    string,
    { count: number; until: number }
  >();
  constructor(@Inject(AuthRepository) private readonly repo: AuthRepository) {}
  async login(email: string, password: string, ip: string) {
    const key = ip.toLowerCase();
    let limit = this.attempts.get(key);
    if (limit && limit.until <= Date.now()) {
      this.attempts.delete(key);
      limit = undefined;
    }
    if (limit && limit.count >= 8)
      throw new HttpException(
        "Çok fazla deneme. 15 dakika sonra yeniden deneyin.",
        429,
      );
    const user = await this.repo.byEmail(email);
    const valid = await verifyPassword(password, user?.passwordHash || "");
    if (!user || !valid) {
      if (this.attempts.size >= 2048)
        this.attempts.delete(this.attempts.keys().next().value!);
      this.attempts.set(key, {
        count: (limit?.count || 0) + 1,
        until: limit?.until || Date.now() + 900000,
      });
      throw new UnauthorizedException("E-posta veya parola hatalı.");
    }
    this.attempts.delete(key);
    const token = randomBytes(32).toString("hex");
    await this.repo.createSession(user.id, tokenHash(token));
    const { passwordHash: _, ...safe } = user;
    return { user: safe, token };
  }
  current(token: string) {
    return this.repo.session(tokenHash(token));
  }
  logout(hash: string) {
    return this.repo.revoke(hash);
  }
}
