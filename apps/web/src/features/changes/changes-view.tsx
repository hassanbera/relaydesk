"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { changeLabels, type Change } from "@relaydesk/contracts";
import { api, keys } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { dateTime } from "@/lib/format";
import { PageHeader, Loading, ErrorState, Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { ChangeEditor } from "./change-editor";
export function ChangesView() {
  const session = useSession(),
    [editor, setEditor] = useState(false),
    [q, setQ] = useState("");
  const staff = session.data?.role !== "REQUESTER";
  const query = useQuery({
    queryKey: keys.changes,
    queryFn: () => api<Change[]>("/changes"),
    enabled: staff,
  });
  if (!staff)
    return (
      <ErrorState
        error={new Error("Değişiklik yönetimi destek ekibine açıktır.")}
      />
    );
  const rows =
    query.data?.filter((c) =>
      (c.title + " " + c.code)
        .toLocaleLowerCase("tr")
        .includes(q.toLocaleLowerCase("tr")),
    ) || [];
  return (
    <>
      <PageHeader
        title="Değişiklik yönetimi"
        description="Planla, bağımsız onay al ve uygulama sonucunu kaydet."
        actions={
          <Button onClick={() => setEditor(true)}>
            <Plus />
            Yeni değişiklik
          </Button>
        }
      />
      <div className="process-note">
        <ShieldCheck size={20} />
        <p>
          Talep sahibi kendi değişikliğini onaylayamaz. Onay, planlama ve
          uygulama adımları işlem geçmişinde saklanır.
        </p>
      </div>
      <section className="work-surface">
        <div className="resource-toolbar">
          <div className="local-search">
            <Search size={16} />
            <Input
              aria-label="Değişikliklerde ara"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Başlık veya değişiklik numarası ara…"
            />
          </div>
          <span>{rows.length} değişiklik</span>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : !rows.length ? (
          <Empty
            title="Değişiklik bulunamadı"
            description="Bakım veya hizmet değişikliği için yeni bir taslak oluştur."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kayıt</TableHead>
                <TableHead className="min-w-72">Değişiklik</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="min-w-44">Bakım aralığı</TableHead>
                <TableHead>Talep sahibi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link className="record-code" href={"/changes/" + c.id}>
                      {c.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link className="row-title" href={"/changes/" + c.id}>
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={"risk-" + c.risk.toLowerCase()}
                    >
                      {c.risk === "HIGH"
                        ? "Yüksek"
                        : c.risk === "MEDIUM"
                          ? "Orta"
                          : "Düşük"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={"change-status-" + c.status.toLowerCase()}
                    >
                      {changeLabels[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-date">
                    {dateTime(c.plannedStart)}
                    <br />
                    {dateTime(c.plannedEnd)}
                  </TableCell>
                  <TableCell>{c.requesterName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      {editor && <ChangeEditor onClose={() => setEditor(false)} />}
    </>
  );
}
