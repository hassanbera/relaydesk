import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { json, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/http";
import { env } from "./config";
import { dataSource } from "./database/data-source";
async function main() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.use(json({ limit: "128kb" }));
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: () => void) => {
    res.setHeader("X-Request-Id", randomUUID());
    res.setHeader("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("x-relaydesk-request") !== "1" ||
        (req.get("origin") &&
          req.get("origin") !== new URL(env.PUBLIC_ORIGIN).origin))
    ) {
      res.status(403).json({ error: "İstek kaynağı doğrulanamadı." });
      return;
    }
    next();
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app
    .getHttpAdapter()
    .get("/api/health", async (_req: Request, res: Response) => {
      try {
        await dataSource.query("SELECT 1");
        res.json({ data: { status: "ok", database: "ok" } });
      } catch {
        res.status(503).json({ error: "Veritabanına ulaşılamıyor." });
      }
    });
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
  console.log(`RelayDesk API http://${env.HOST}:${env.PORT}/api`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Startup failed");
  process.exitCode = 1;
});
