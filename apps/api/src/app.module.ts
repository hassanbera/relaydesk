import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DataSource } from "typeorm";
import { dataSource } from "./database/data-source";
import { AuthRepository } from "./auth/auth.repository";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { TicketsRepository } from "./tickets/tickets.repository";
import { TicketsService } from "./tickets/tickets.service";
import { TicketsController } from "./tickets/tickets.controller";
import { ResourcesRepository } from "./resources/resources.repository";
import { ResourcesService } from "./resources/resources.service";
import { ResourcesController } from "./resources/resources.controller";
import { DashboardRepository } from "./dashboard/dashboard.repository";
import { DashboardService } from "./dashboard/dashboard.service";
import { DashboardController } from "./dashboard/dashboard.controller";
@Global()
@Module({
  providers: [
    { provide: DataSource, useFactory: () => dataSource.initialize() },
  ],
  exports: [DataSource],
})
class DatabaseModule {}
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
  exports: [AuthService],
})
class AuthModule {}
@Module({
  controllers: [TicketsController],
  providers: [TicketsRepository, TicketsService],
  exports: [TicketsRepository],
})
class TicketsModule {}
@Module({
  controllers: [ResourcesController],
  providers: [ResourcesRepository, ResourcesService],
})
class ResourcesModule {}
@Module({
  imports: [TicketsModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
})
class DashboardModule {}
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TicketsModule,
    ResourcesModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
