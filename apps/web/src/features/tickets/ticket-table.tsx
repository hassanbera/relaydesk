"use client";
import Link from "next/link";
import type { Ticket } from "@relaydesk/contracts";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  TicketLink,
  PriorityBadge,
  StatusBadge,
  Sla,
} from "@/components/common";
import { initials, dateTime } from "@/lib/format";
export function TicketTable({
  tickets,
  returnTo,
}: {
  tickets: Ticket[];
  returnTo?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Kayıt</TableHead>
          <TableHead className="min-w-64">Talep</TableHead>
          <TableHead>Öncelik</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="min-w-40">SLA hedefi</TableHead>
          <TableHead className="min-w-40">Görevli / ekip</TableHead>
          <TableHead className="whitespace-nowrap">Güncelleme</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => (
          <TableRow key={t.id}>
            <TableCell>
              <Link
                className="record-code"
                href={
                  "/tickets/" +
                  t.id +
                  (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : "")
                }
              >
                {t.code}
              </Link>
            </TableCell>
            <TableCell>
              <TicketLink ticket={t} returnTo={returnTo} />
            </TableCell>
            <TableCell>
              <PriorityBadge priority={t.priority} />
            </TableCell>
            <TableCell>
              <StatusBadge status={t.status} />
            </TableCell>
            <TableCell>
              <Sla ticket={t} />
            </TableCell>
            <TableCell>
              <div className="assignee-cell">
                {t.assigneeName ? (
                  <span className="small-avatar">
                    {initials(t.assigneeName)}
                  </span>
                ) : (
                  <span className="unassigned-mark" />
                )}
                <span>
                  {t.assigneeName || "Atanmadı"}
                  <small>{t.teamName || "Ekip seçilmedi"}</small>
                </span>
              </div>
            </TableCell>
            <TableCell className="table-date">
              {dateTime(t.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
