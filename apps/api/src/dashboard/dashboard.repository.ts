import { Inject, Injectable } from "@nestjs/common";
import { User } from "../model/entities";
import { TicketsRepository } from "../tickets/tickets.repository";
import { breachSql, riskSql } from "../tickets/rules";
@Injectable()
export class DashboardRepository {
  constructor(
    @Inject(TicketsRepository) private readonly tickets: TicketsRepository,
  ) {}
  async data(user: User) {
    const scope = () => this.tickets.scope(user);
    const open = () =>
      scope().andWhere("t.status NOT IN ('RESOLVED','CLOSED')");
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const from = new Date(+start - 6 * 86400000);
    const [
      openCount,
      unassigned,
      breached,
      atRisk,
      resolvedToday,
      byStatus,
      byPriority,
      recent,
      created,
      resolved,
    ] = await Promise.all([
      open().getCount(),
      open().andWhere('t."assigneeId" IS NULL').getCount(),
      open().andWhere(breachSql).getCount(),
      open().andWhere(riskSql).getCount(),
      scope().andWhere('t."resolvedAt">=:start', { start }).getCount(),
      scope()
        .select("t.status", "status")
        .addSelect("COUNT(*)::int", "count")
        .groupBy("t.status")
        .getRawMany(),
      open()
        .select("t.priority", "priority")
        .addSelect("COUNT(*)::int", "count")
        .groupBy("t.priority")
        .orderBy("t.priority")
        .getRawMany(),
      this.tickets
        .joined(user)
        .orderBy("t.updatedAt", "DESC")
        .take(5)
        .getMany(),
      scope()
        .select(
          `to_char(t."createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD')`,
          "date",
        )
        .addSelect("COUNT(*)::int", "count")
        .where(user.role === "REQUESTER" ? 't."requesterId"=:actor' : "true", {
          actor: user.id,
        })
        .andWhere('t."createdAt">=:from', { from })
        .groupBy("date")
        .getRawMany(),
      scope()
        .select(
          `to_char(t."resolvedAt" AT TIME ZONE 'UTC','YYYY-MM-DD')`,
          "date",
        )
        .addSelect("COUNT(*)::int", "count")
        .andWhere('t."resolvedAt">=:from', { from })
        .groupBy("date")
        .getRawMany(),
    ]);
    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(+from + i * 86400000).toISOString().slice(0, 10);
      return {
        date,
        created: created.find((x) => x.date === date)?.count || 0,
        resolved: resolved.find((x) => x.date === date)?.count || 0,
      };
    });
    return {
      open: openCount,
      unassigned,
      breached,
      atRisk,
      resolvedToday,
      byStatus,
      byPriority,
      recent: recent.map((t) => this.tickets.view(t)),
      daily,
    };
  }
}
