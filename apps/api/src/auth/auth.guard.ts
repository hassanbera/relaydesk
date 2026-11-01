import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { AuthRequest } from "../common/http";
import { tokenHash } from "./password";
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>("public", [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.rd_session;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException("Oturum açın.");
    const found = await this.auth.current(token);
    if (!found) throw new UnauthorizedException("Oturum sona erdi.");
    req.user = found.user;
    req.sessionHash = tokenHash(token);
    const roles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(req.user.role))
      throw new ForbiddenException("Bu işlem için yetkiniz yok.");
    return true;
  }
}
