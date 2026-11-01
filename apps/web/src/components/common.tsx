"use client";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  PauseCircle,
  RefreshCw,
} from "lucide-react";
import type { Ticket, Status, Priority } from "@relaydesk/contracts";
import { statusLabels, priorityLabels } from "@relaydesk/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClock } from "./providers";
import { dateTime } from "@/lib/format";
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>İşlem tamamlanamadı</AlertTitle>
      <AlertDescription>
        {error instanceof Error
          ? error.message
          : "Bağlantıyı kontrol edip yeniden deneyin."}
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw />
            Yeniden dene
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status" aria-label="Yükleniyor">
      <Skeleton className="h-8 w-48" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton className="h-14 w-full" key={i} />
      ))}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="secondary"
      className={"status-badge status-" + status.toLowerCase()}
    >
      <span className="status-dot" />
      {statusLabels[status]}
    </Badge>
  );
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="outline"
      className={"priority-badge priority-" + priority.toLowerCase()}
    >
      {priority}
      <span>{priorityLabels[priority]}</span>
    </Badge>
  );
}
export function Sla({ ticket: t }: { ticket: Ticket }) {
  const now = useClock();
  const due = t.firstResponseAt ? t.resolutionDueAt : t.responseDueAt;
  const paused = t.slaState === "PAUSED";
  const completed = t.slaState === "COMPLETED";
  const late = t.slaState === "BREACHED";
  const mins = Math.max(0, Math.ceil((+new Date(due) - now) / 60000));
  const duration =
    mins >= 1440
      ? `${Math.floor(mins / 1440)} gün`
      : mins >= 60
        ? `${Math.floor(mins / 60)} sa ${mins % 60} dk`
        : `${mins} dk`;
  return (
    <span
      className={"sla-cell sla-" + t.slaState.toLowerCase()}
      title={`${t.firstResponseAt ? "Çözüm" : "İlk yanıt"} hedefi: ${dateTime(due)}`}
    >
      {completed ? (
        <CheckCircle2 size={14} />
      ) : paused ? (
        <PauseCircle size={14} />
      ) : (
        <Clock3 size={14} />
      )}
      <span>
        {late
          ? "SLA aşıldı"
          : paused
            ? "Saat duraklatıldı"
            : completed
              ? "Tamamlandı"
              : duration + " kaldı"}
        <small>
          {completed || late || paused
            ? ""
            : t.firstResponseAt
              ? "Çözüm hedefi"
              : "İlk yanıt hedefi"}
        </small>
      </span>
    </span>
  );
}
export function TicketLink({
  ticket,
  returnTo,
}: {
  ticket: Ticket;
  returnTo?: string;
}) {
  return (
    <div className="ticket-title">
      <Link
        href={
          "/tickets/" +
          ticket.id +
          (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : "")
        }
      >
        {ticket.title}
      </Link>
      <span>
        {ticket.type === "INCIDENT" ? "Olay" : "Hizmet talebi"} ·{" "}
        {ticket.requesterName}
      </span>
    </div>
  );
}
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <ArrowRight size={15} className="rotate-180" />
      {children}
    </Link>
  );
}
