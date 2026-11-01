"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Dashboard } from "@relaydesk/contracts";
import { priorityLabels } from "@relaydesk/contracts";
import { api, keys } from "@/lib/api";
import { PageHeader, Loading, ErrorState } from "@/components/common";
import { TicketTable } from "@/features/tickets/ticket-table";
import {
  ArrowUpRight,
  Clock3,
  Inbox,
  UserRoundCheck,
  CheckCircle2,
} from "lucide-react";
export function Overview() {
  const q = useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api<Dashboard>("/dashboard"),
    refetchInterval: 60000,
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const d = q.data,
    max = Math.max(1, ...d.daily.flatMap((x) => [x.created, x.resolved]));
  return (
    <>
      <PageHeader
        title="Genel bakış"
        description="Ekibin iş yükü, hizmet hedefleri ve son hareketler."
      />
      <section className="overview-ledger" aria-label="Operasyon özeti">
        {[
          {
            label: "Açık talepler",
            value: d.open,
            icon: Inbox,
            href: "/tickets",
          },
          {
            label: "Atama bekleyen",
            value: d.unassigned,
            icon: UserRoundCheck,
            href: "/tickets",
          },
          {
            label: "SLA aşımı",
            value: d.breached,
            icon: Clock3,
            href: "/tickets?sla=breached",
          },
          {
            label: "Bugün çözülen",
            value: d.resolvedToday,
            icon: CheckCircle2,
            href: "/tickets",
          },
        ].map((s) => (
          <Link href={s.href} key={s.label}>
            <span>
              <s.icon size={17} />
              {s.label}
            </span>
            <strong>{s.value}</strong>
            <ArrowUpRight className="ledger-arrow" size={18} />
          </Link>
        ))}
      </section>
      <div className="overview-panels">
        <section className="work-surface chart-panel">
          <div className="section-title">
            <div>
              <h2>Talep akışı</h2>
              <p>Son 7 gün · UTC gün sınırları</p>
            </div>
            <div className="chart-legend">
              <span>
                <i />
                Açılan
              </span>
              <span>
                <i />
                Çözülen
              </span>
            </div>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={d.daily
              .map(
                (x) => `${x.date}: ${x.created} açılan, ${x.resolved} çözülen`,
              )
              .join("; ")}
          >
            {d.daily.map((x) => (
              <div className="bar-day" key={x.date}>
                <div className="bar-pair">
                  <span
                    style={{ height: `${(x.created / max) * 100}%` }}
                    title={`${x.created} açılan`}
                  />
                  <span
                    style={{ height: `${(x.resolved / max) * 100}%` }}
                    title={`${x.resolved} çözülen`}
                  />
                </div>
                <small>
                  {new Intl.DateTimeFormat("tr-TR", {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(x.date))}
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="work-surface priority-panel">
          <h2>Öncelik dağılımı</h2>
          <p>Açık taleplerin öncelikleri</p>
          {(["P1", "P2", "P3", "P4"] as const).map((p) => {
            const count =
              d.byPriority.find((x) => x.priority === p)?.count || 0;
            return (
              <div className="priority-distribution" key={p}>
                <div>
                  <span>
                    {p} · {priorityLabels[p]}
                  </span>
                  <strong>{count}</strong>
                </div>
                <div
                  className={"distribution-track priority-" + p.toLowerCase()}
                >
                  <span
                    style={{ width: `${d.open ? (count / d.open) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Link className="text-link" href="/tickets?sla=risk">
            {d.atRisk} talep SLA hedefine yaklaşıyor <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="work-surface">
        <div className="section-title surface-title">
          <h2>Son güncellenen talepler</h2>
          <Link className="text-link" href="/tickets">
            Tüm talepler
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <TicketTable tickets={d.recent} />
      </section>
    </>
  );
}
