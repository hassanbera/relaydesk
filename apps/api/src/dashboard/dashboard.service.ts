import { Inject, Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import { User } from "../model/entities";
@Injectable()
export class DashboardService {
  constructor(
    @Inject(DashboardRepository) private readonly repo: DashboardRepository,
  ) {}
  data(user: User) {
    return this.repo.data(user);
  }
}
