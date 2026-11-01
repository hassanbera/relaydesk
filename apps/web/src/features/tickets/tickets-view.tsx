"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import type {
  Ticket,
  Page,
  Dashboard,
  Status,
  Priority,
} from "@relaydesk/contracts";
import { statuses, statusLabels } from "@relaydesk/contracts";
import { api, keys } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Loading, ErrorState, Empty } from "@/components/common";
import { useSession } from "@/hooks/use-session";
import { NewTicket } from "./new-ticket";
import { TicketTable } from "./ticket-table";
export function TicketsRoute() {
  const params = useSearchParams(),
    router = useRouter();
  const q = params.get("q") || "";
  const status = statuses.includes(params.get("status") as Status)
    ? params.get("status")!
    : "ALL";
  const priority = ["P1", "P2", "P3", "P4"].includes(
    params.get("priority") || "",
  )
    ? params.get("priority")!
    : "ALL";
  const mine = params.get("mine") === "true";
  const sla = ["risk", "breached"].includes(params.get("sla") || "")
    ? params.get("sla")!
    : "";
  const sort = ["updated", "oldest", "priority"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "updated";
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(params.get("page") || "1", 10) || 1),
  );
  const [search, setSearch] = useState(q),
    [create, setCreate] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const session = useSession();
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );
  function updateFilters(patch: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (
        !value ||
        value === "ALL" ||
        value === "false" ||
        (key === "sort" && value === "updated") ||
        (key === "page" && value === "1")
      )
        next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    router.replace("/tickets" + (next.size ? "?" + next : ""), {
      scroll: false,
    });
  }
  const returnTo = "/tickets" + (params.size ? "?" + params : "");
  const filters = { q, status, priority, mine, sla, sort, page };
  const query = useQuery({
    queryKey: [...keys.tickets, filters],
    queryFn: () => {
      const p = new URLSearchParams({
        q,
        page: String(page),
        limit: "12",
        sort,
        mine: String(mine),
      });
      if (status !== "ALL") p.set("status", status);
      if (priority !== "ALL") p.set("priority", priority);
      if (sla) p.set("sla", sla);
      return api<Page<Ticket>>("/tickets?" + p);
    },
    placeholderData: keepPreviousData,
  });
  const dashboard = useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api<Dashboard>("/dashboard"),
  });
  return (
    <>
      <PageHeader
        title={
          session.data?.role === "REQUESTER" ? "Taleplerim" : "Talep kuyruğu"
        }
        description="Olayları ve hizmet taleplerini tek akışta takip et."
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus />
            Yeni talep
          </Button>
        }
      />
      <div className="queue-summary">
        <div>
          <span className="summary-dot" />
          {dashboard.data?.open ?? "—"} açık talep
        </div>
        <span className="summary-divider" />
        <div className="summary-risk">
          <Clock3 size={15} />
          {dashboard.data?.atRisk ?? "—"} SLA hedefine yaklaşıyor
        </div>
        <div className="summary-breach">
          {dashboard.data?.breached ?? "—"} SLA aşımı
        </div>
        <span className="summary-note">SLA saatleri 7/24 işler</span>
      </div>
      <section className="work-surface" aria-label="Talep listesi">
        <div className="queue-tabs">
          <Tabs
            value={status}
            onValueChange={(v) => updateFilters({ status: v })}
          >
            <TabsList variant="line">
              <TabsTrigger value="ALL">Tümü</TabsTrigger>
              {statuses.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {statusLabels[s]}
                  <span className="tab-count">
                    {dashboard.data?.byStatus.find((x) => x.status === s)
                      ?.count || 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="queue-filters">
          <div className="local-search">
            <Search size={16} />
            <Input
              placeholder="Başlık, numara veya talep sahibi ara…"
              aria-label="Talep ara"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (searchTimer.current) clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(
                  () => updateFilters({ q: value }),
                  300,
                );
              }}
            />
          </div>
          <NativeSelect
            aria-label="Öncelik filtresi"
            value={priority}
            onChange={(e) => updateFilters({ priority: e.target.value })}
          >
            <NativeSelectOption value="ALL">Tüm öncelikler</NativeSelectOption>
            {(["P1", "P2", "P3", "P4"] as const).map((p) => (
              <NativeSelectOption value={p} key={p}>
                {p}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="SLA filtresi"
            value={sla}
            onChange={(e) => updateFilters({ sla: e.target.value })}
          >
            <NativeSelectOption value="">Tüm SLA durumları</NativeSelectOption>
            <NativeSelectOption value="risk">
              Hedefe yaklaşanlar
            </NativeSelectOption>
            <NativeSelectOption value="breached">SLA aşımı</NativeSelectOption>
          </NativeSelect>
          {session.data?.role !== "REQUESTER" && (
            <Button
              variant={mine ? "secondary" : "outline"}
              onClick={() => updateFilters({ mine: String(!mine) })}
              aria-pressed={mine}
            >
              <SlidersHorizontal />
              Bana atananlar
            </Button>
          )}
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : !query.data.items.length ? (
          <Empty
            title="Bu görünümde talep bulunmuyor"
            description="Filtreleri değiştirebilir veya yeni bir talep oluşturabilirsin."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  setSearch("");
                  updateFilters({
                    q: "",
                    status: "ALL",
                    priority: "ALL",
                    sla: "",
                    mine: "false",
                  });
                }}
              >
                Filtreleri temizle
              </Button>
            }
          />
        ) : (
          <div
            className={query.isFetching ? "table-updating" : ""}
            aria-busy={query.isFetching}
          >
            <TicketTable tickets={query.data.items} returnTo={returnTo} />
          </div>
        )}
        <div className="table-footer">
          <span>
            {query.data?.total ?? 0} kayıt · Sayfa {page} /{" "}
            {Math.max(1, Math.ceil((query.data?.total || 0) / 12))}
          </span>
          <div className="pagination-controls">
            <NativeSelect
              aria-label="Sıralama"
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
            >
              <NativeSelectOption value="updated">
                Son güncellenen
              </NativeSelectOption>
              <NativeSelectOption value="oldest">
                En eski kayıt
              </NativeSelectOption>
              <NativeSelectOption value="priority">
                Öncelik sırası
              </NativeSelectOption>
            </NativeSelect>
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1 || query.isFetching}
              aria-label="Önceki sayfa"
              onClick={() => updateFilters({ page: String(page - 1) }, false)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={
                !query.data || page * 12 >= query.data.total || query.isFetching
              }
              aria-label="Sonraki sayfa"
              onClick={() => updateFilters({ page: String(page + 1) }, false)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </section>
      {create && <NewTicket onClose={() => setCreate(false)} />}
    </>
  );
}
