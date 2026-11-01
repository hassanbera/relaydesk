import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  Index,
} from "typeorm";
import { randomUUID } from "node:crypto";
import type { Role, Status, Priority } from "@relaydesk/contracts";
export abstract class Base {
  @PrimaryColumn("uuid") id: string = randomUUID();
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
@Entity("teams")
export class Team extends Base {
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", default: "" }) description: string;
}
@Entity("users")
export class User extends Base {
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", unique: true }) email: string;
  @Column({ type: "varchar" }) role: Role;
  @Column({ type: "uuid", nullable: true }) teamId: string | null;
  @Column({ type: "text", select: false }) passwordHash: string;
  @Column({ type: "boolean", default: true }) active: boolean;
}
@Entity("sessions")
export class Session extends Base {
  @Column({ type: "varchar", unique: true, select: false }) tokenHash: string;
  @Column("uuid") userId: string;
  @Column("timestamptz") expiresAt: Date;
}
@Entity("sla_policies")
export class SlaPolicy extends Base {
  @Column({ type: "varchar", unique: true }) priority: Priority;
  @Column("int") responseMinutes: number;
  @Column("int") resolutionMinutes: number;
}
@Entity("catalog")
export class Catalog extends Base {
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) description: string;
  @Column({ type: "varchar" }) category: string;
  @Column("uuid") teamId: string;
  @Column({ type: "boolean", default: true }) active: boolean;
}
@Entity("assets")
export class Asset extends Base {
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", unique: true }) tag: string;
  @Column({ type: "varchar" }) type: string;
  @Column({ type: "varchar", default: "" }) serial: string;
  @Column({ type: "varchar" }) status: string;
  @Column({ type: "uuid", nullable: true }) ownerId: string | null;
  @Column({ type: "varchar", default: "" }) location: string;
  @Column({ type: "varchar", default: "" }) notes: string;
  @Column({ type: "integer", default: 1 }) version: number;
}
@Entity("tickets")
export class Ticket extends Base {
  @Column("int") @Generated("increment") number: number;
  @Column({ type: "varchar" }) title: string;
  @Column("text") description: string;
  @Column({ type: "varchar" }) type: string;
  @Column({ type: "varchar" }) category: string;
  @Column({ type: "varchar" }) impact: string;
  @Column({ type: "varchar" }) urgency: string;
  @Column({ type: "varchar" }) priority: Priority;
  @Column({ type: "varchar", default: "NEW" }) status: Status;
  @Column({ type: "integer", default: 1 }) version: number;
  @Column("uuid") requesterId: string;
  @Column({ type: "uuid", nullable: true }) teamId: string | null;
  @Column({ type: "uuid", nullable: true }) assigneeId: string | null;
  @Column({ type: "uuid", nullable: true }) assetId: string | null;
  @Column({ type: "uuid", nullable: true }) catalogId: string | null;
  @Column("timestamptz") responseDueAt: Date;
  @Column("timestamptz") resolutionDueAt: Date;
  @Column({ type: "timestamptz", nullable: true }) firstResponseAt: Date | null;
  @Column({ type: "timestamptz", nullable: true }) resolvedAt: Date | null;
  @Column({ type: "timestamptz", nullable: true }) pausedAt: Date | null;
  @Column({
    type: "bigint",
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  pausedMs: number;
  @Column({ type: "text", default: "" }) resolution: string;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}
@Entity("comments")
export class Comment extends Base {
  @Column("uuid") ticketId: string;
  @Column("uuid") authorId: string;
  @Column("text") body: string;
  @Column({ type: "boolean", default: false }) internal: boolean;
}
@Entity("audit_events")
@Index(["entityType", "entityId", "createdAt"])
export class AuditEvent extends Base {
  @Column({ type: "varchar" }) entityType: string;
  @Column("uuid") entityId: string;
  @Column("uuid") actorId: string;
  @Column({ type: "varchar" }) action: string;
  @Column({ type: "jsonb", default: {} }) details: Record<string, unknown>;
}
@Entity("articles")
export class Article extends Base {
  @Column({ type: "varchar" }) title: string;
  @Column({ type: "varchar" }) category: string;
  @Column({ type: "varchar" }) summary: string;
  @Column("text") body: string;
  @Column({ type: "boolean", default: false }) published: boolean;
  @Column("uuid") authorId: string;
  @Column({ type: "integer", default: 1 }) version: number;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}
@Entity("changes")
export class Change extends Base {
  @Column("int") @Generated("increment") number: number;
  @Column({ type: "varchar" }) title: string;
  @Column("text") description: string;
  @Column({ type: "varchar" }) risk: string;
  @Column("text") reason: string;
  @Column("text") implementation: string;
  @Column("text") rollback: string;
  @Column("timestamptz") plannedStart: Date;
  @Column("timestamptz") plannedEnd: Date;
  @Column({ type: "uuid", nullable: true }) assetId: string | null;
  @Column({ type: "varchar", default: "DRAFT" }) status: string;
  @Column("uuid") requesterId: string;
  @Column({ type: "uuid", nullable: true }) approverId: string | null;
  @Column({ type: "timestamptz", nullable: true }) approvedAt: Date | null;
  @Column({ type: "text", default: "" }) decisionNote: string;
  @Column({ type: "integer", default: 1 }) version: number;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}
export const entities = [
  Team,
  User,
  Session,
  SlaPolicy,
  Catalog,
  Asset,
  Ticket,
  Comment,
  AuditEvent,
  Article,
  Change,
];
