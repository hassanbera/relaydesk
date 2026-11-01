import { Body, Controller, Get, Inject, Post, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { loginSchema } from "@relaydesk/contracts";
import { AuthService } from "./auth.service";
import { Actor, AuthRequest, Public, ZodPipe } from "../common/http";
import { User } from "../model/entities";
import { env } from "../config";
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public() @Post("login") async login(
    @Body(new ZodPipe(loginSchema)) body: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(
      body.email,
      body.password,
      req.ip || "unknown",
    );
    res.cookie("rd_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/api",
      maxAge: 8 * 3600000,
    });
    return { data: user };
  }
  @Get("me") me(@Actor() user: User) {
    return { data: user };
  }
  @Post("logout") async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.sessionHash);
    res.clearCookie("rd_session", {
      path: "/api",
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    });
    return { data: { ok: true } };
  }
}
