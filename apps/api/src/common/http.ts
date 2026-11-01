import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  Logger,
  PipeTransform,
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { User } from "../model/entities";
export interface AuthRequest extends Request {
  user: User;
  sessionHash: string;
}
export const Public = () => SetMetadata("public", true);
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
export const Actor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthRequest>().user,
);
@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}
  transform(value: unknown) {
    const r = this.schema.safeParse(value);
    if (!r.success)
      throw new BadRequestException({
        message: "Alanları kontrol edin.",
        issues: r.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    return r.data;
  }
}
export const uuidPipe = new ZodPipe(z.uuid());
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("API");
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = 500,
      body: unknown = { message: "İşlem tamamlanamadı." };
    if (error instanceof HttpException) {
      status = error.getStatus();
      body = error.getResponse();
    } else if (typeof error === "object" && error && "driverError" in error) {
      const code = (error as { driverError: { code?: string } }).driverError
        .code;
      if (["23505", "23503", "23514", "40001", "40P01"].includes(code || "")) {
        status = 409;
        body = {
          message:
            "İşlem mevcut kayıtlarla çakışıyor. Bilgileri kontrol edip yeniden deneyin.",
        };
      }
    }
    if (status === 500)
      this.logger.error(
        error instanceof Error ? error.stack : "Unknown failure",
      );
    res
      .status(status)
      .json({
        error:
          typeof body === "string"
            ? body
            : ((body as { message?: unknown }).message ??
              "İşlem tamamlanamadı."),
        ...((body as { issues?: unknown })?.issues
          ? { issues: (body as { issues: unknown }).issues }
          : {}),
      });
  }
}
