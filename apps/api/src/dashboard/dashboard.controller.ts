import { Controller, Get, Inject } from "@nestjs/common";
import { Actor } from "../common/http";
import { User } from "../model/entities";
import { DashboardService } from "./dashboard.service";
@Controller("dashboard")
export class DashboardController {
  constructor(
    @Inject(DashboardService) private readonly service: DashboardService,
  ) {}
  @Get() data(@Actor() user: User) {
    return this.service.data(user).then((data) => ({ data }));
  }
}
