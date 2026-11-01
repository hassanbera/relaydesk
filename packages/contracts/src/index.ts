import { z } from "zod";
export const roles = ["ADMIN", "AGENT", "REQUESTER"] as const;
export const statuses = [
  "NEW",
  "IN_PROGRESS",
  "PENDING",
  "RESOLVED",
  "CLOSED",
] as const;
export const priorities = ["P1", "P2", "P3", "P4"] as const;
export const levels = ["LOW", "MEDIUM", "HIGH"] as const;
export const ticketTypes = ["INCIDENT", "REQUEST"] as const;
export type Role = (typeof roles)[number];
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];
const id = z.uuid();
const text = (n: number) => z.string().trim().min(1).max(n);
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(200),
  })
  .strict();
export const ticketCreateSchema = z
  .object({
    title: text(160),
    description: text(10000),
    type: z.enum(ticketTypes),
    impact: z.enum(levels),
    urgency: z.enum(levels),
    catalogId: id.optional(),
    assetId: id.optional(),
    teamId: id.optional(),
    assigneeId: id.optional(),
  })
  .strict();
export const ticketUpdateSchema = z
  .object({
    version: z.number().int().positive(),
    title: text(160).optional(),
    description: text(10000).optional(),
    impact: z.enum(levels).optional(),
    urgency: z.enum(levels).optional(),
    status: z.enum(statuses).optional(),
    teamId: id.nullable().optional(),
    assigneeId: id.nullable().optional(),
    resolution: z.string().trim().max(5000).optional(),
  })
  .strict();
export const ticketListSchema = z
  .object({
    q: z.string().trim().max(120).default(""),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    type: z.enum(ticketTypes).optional(),
    mine: z.enum(["true", "false"]).default("false"),
    sla: z.enum(["breached", "risk"]).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(15),
    sort: z.enum(["updated", "oldest", "priority"]).default("updated"),
  })
  .strict();
export const commentSchema = z
  .object({ body: text(8000), internal: z.boolean().default(false) })
  .strict();
export const assetSchema = z
  .object({
    name: text(120),
    tag: text(40),
    type: z.enum([
      "LAPTOP",
      "DESKTOP",
      "SERVER",
      "NETWORK",
      "SOFTWARE",
      "OTHER",
    ]),
    serial: z.string().trim().max(120).default(""),
    status: z.enum(["IN_USE", "AVAILABLE", "MAINTENANCE", "RETIRED"]),
    ownerId: id.nullable().default(null),
    location: z.string().trim().max(120).default(""),
    notes: z.string().trim().max(3000).default(""),
  })
  .strict();
export const articleSchema = z
  .object({
    title: text(160),
    category: text(80),
    summary: text(400),
    body: text(30000),
    published: z.boolean().default(false),
  })
  .strict();
export const changeStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "IMPLEMENTED",
  "REJECTED",
  "FAILED",
] as const;
export const changeSchema = z
  .object({
    title: text(160),
    description: text(10000),
    risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
    reason: text(5000),
    implementation: text(10000),
    rollback: text(10000),
    plannedStart: z.iso.datetime({ offset: true }),
    plannedEnd: z.iso.datetime({ offset: true }),
    assetId: id.nullable().default(null),
  })
  .strict()
  .refine((v) => new Date(v.plannedEnd) > new Date(v.plannedStart), {
    message: "Bitiş başlangıçtan sonra olmalı",
    path: ["plannedEnd"],
  });
export const changeTransitionSchema = z
  .object({
    version: z.number().int().positive(),
    status: z.enum(changeStatuses),
    note: z.string().trim().max(5000).default(""),
  })
  .strict();
export const userCreateSchema = z
  .object({
    name: text(100),
    email: z
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    role: z.enum(roles),
    teamId: id.nullable().default(null),
    password: z.string().min(12).max(200),
  })
  .strict();
export const userUpdateSchema = z
  .object({
    name: text(100),
    role: z.enum(roles),
    teamId: id.nullable(),
    active: z.boolean(),
  })
  .strict();
export const teamSchema = z
  .object({
    name: text(100),
    description: z.string().trim().max(500).default(""),
  })
  .strict();
export const policySchema = z
  .object({
    responseMinutes: z.number().int().min(1).max(43200),
    resolutionMinutes: z.number().int().min(1).max(43200),
  })
  .strict()
  .refine((v) => v.resolutionMinutes >= v.responseMinutes, {
    message: "Çözüm süresi yanıt süresinden kısa olamaz",
    path: ["resolutionMinutes"],
  });
export const catalogSchema = z
  .object({
    name: text(120),
    description: text(1200),
    category: text(80),
    teamId: id,
    active: z.boolean().default(true),
  })
  .strict();
export type TicketCreate = z.infer<typeof ticketCreateSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;
export type TicketFilters = z.infer<typeof ticketListSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type ChangeInput = z.infer<typeof changeSchema>;
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string | null;
  active: boolean;
}
export interface Team {
  id: string;
  name: string;
  description: string;
}
export interface Policy {
  id: string;
  priority: Priority;
  responseMinutes: number;
  resolutionMinutes: number;
}
export interface Catalog {
  id: string;
  name: string;
  description: string;
  category: string;
  teamId: string;
  active: boolean;
}
export interface Asset extends AssetInput {
  id: string;
  version: number;
  createdAt: string;
  ownerName?: string | null;
}
export interface Article extends ArticleInput {
  id: string;
  authorId: string;
  authorName?: string;
  version: number;
  updatedAt: string;
}
export interface Change extends ChangeInput {
  id: string;
  number: number;
  code: string;
  version: number;
  status: (typeof changeStatuses)[number];
  requesterId: string;
  requesterName: string;
  approverId: string | null;
  approvedAt: string | null;
  decisionNote: string;
  createdAt: string;
  updatedAt: string;
}
export interface Ticket {
  id: string;
  number: number;
  code: string;
  title: string;
  description: string;
  type: (typeof ticketTypes)[number];
  category: string;
  impact: (typeof levels)[number];
  urgency: (typeof levels)[number];
  priority: Priority;
  status: Status;
  version: number;
  requesterId: string;
  requesterName: string;
  teamId: string | null;
  teamName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assetId: string | null;
  assetName: string | null;
  catalogId: string | null;
  createdAt: string;
  updatedAt: string;
  responseDueAt: string;
  resolutionDueAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  pausedAt: string | null;
  resolution: string;
  slaState: "ON_TRACK" | "AT_RISK" | "BREACHED" | "PAUSED" | "COMPLETED";
}
export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  internal: boolean;
  createdAt: string;
}
export interface Audit {
  id: string;
  action: string;
  actorName: string;
  details: Record<string, unknown>;
  createdAt: string;
}
export interface TicketDetail extends Ticket {
  comments: Comment[];
  history: Audit[];
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Dashboard {
  open: number;
  unassigned: number;
  breached: number;
  atRisk: number;
  resolvedToday: number;
  byStatus: { status: Status; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  recent: Ticket[];
  daily: { date: string; created: number; resolved: number }[];
}
export const statusLabels: Record<Status, string> = {
  NEW: "Yeni",
  IN_PROGRESS: "İşlemde",
  PENDING: "Beklemede",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapandı",
};
export const roleLabels: Record<Role, string> = {
  ADMIN: "Yönetici",
  AGENT: "Destek uzmanı",
  REQUESTER: "Çalışan",
};
export const priorityLabels: Record<Priority, string> = {
  P1: "Kritik",
  P2: "Yüksek",
  P3: "Orta",
  P4: "Düşük",
};
export const changeLabels: Record<Change["status"], string> = {
  DRAFT: "Taslak",
  PENDING_APPROVAL: "Onay bekliyor",
  APPROVED: "Onaylandı",
  SCHEDULED: "Planlandı",
  IMPLEMENTED: "Uygulandı",
  REJECTED: "Reddedildi",
  FAILED: "Başarısız",
};
export function priorityFor(
  impact: (typeof levels)[number],
  urgency: (typeof levels)[number],
): Priority {
  const score = levels.indexOf(impact) + levels.indexOf(urgency);
  return score === 4 ? "P1" : score === 3 ? "P2" : score === 2 ? "P3" : "P4";
}
