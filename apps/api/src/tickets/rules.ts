import type { Status } from "@relaydesk/contracts";
import { Ticket } from "../model/entities";
export const transitions: Record<Status, Status[]> = {
  NEW: ["IN_PROGRESS", "PENDING"],
  IN_PROGRESS: ["PENDING", "RESOLVED"],
  PENDING: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};
export function slaState(
  t: Pick<
    Ticket,
    | "firstResponseAt"
    | "responseDueAt"
    | "resolutionDueAt"
    | "resolvedAt"
    | "pausedAt"
    | "status"
  >,
  now = new Date(),
) {
  const clock = t.pausedAt || now;
  const responseLate = t.firstResponseAt
    ? +t.firstResponseAt > +t.responseDueAt
    : +clock > +t.responseDueAt;
  const resolutionLate = +(t.resolvedAt || clock) > +t.resolutionDueAt;
  if (responseLate || resolutionLate) return "BREACHED" as const;
  if (["RESOLVED", "CLOSED"].includes(t.status)) return "COMPLETED" as const;
  if (t.pausedAt) return "PAUSED" as const;
  const next = t.firstResponseAt
    ? t.resolutionDueAt
    : new Date(Math.min(+t.responseDueAt, +t.resolutionDueAt));
  return +next - +now <= 30 * 60000
    ? ("AT_RISK" as const)
    : ("ON_TRACK" as const);
}
export const breachSql = `(COALESCE(t."firstResponseAt",COALESCE(t."pausedAt",CURRENT_TIMESTAMP)) > t."responseDueAt" OR COALESCE(t."resolvedAt",COALESCE(t."pausedAt",CURRENT_TIMESTAMP)) > t."resolutionDueAt")`;
export const riskSql = `(NOT ${breachSql} AND t."pausedAt" IS NULL AND t.status NOT IN ('RESOLVED','CLOSED') AND LEAST(CASE WHEN t."firstResponseAt" IS NULL THEN t."responseDueAt" ELSE t."resolutionDueAt" END,t."resolutionDueAt") <= CURRENT_TIMESTAMP + interval '30 minutes')`;
