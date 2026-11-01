"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { changeLabels, type Change } from "@relaydesk/contracts";
import { api, send, keys } from "@/lib/api";
import type { ChangeDetail } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { PageHeader, BackLink, Loading, ErrorState } from "@/components/common";
import { EntityForm, FormDialog } from "@/components/entity-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dateTime } from "@/lib/format";
import { Pencil, ShieldCheck, CalendarClock, History } from "lucide-react";
import { ChangeEditor } from "./change-editor";
export function ChangeDetailView({ id }: { id: string }) {
  const session = useSession(),
    client = useQueryClient(),
    [edit, setEdit] = useState(false),
    [decision, setDecision] = useState<Change["status"] | null>(null);
  const staff = session.data?.role !== "REQUESTER";
  const q = useQuery({
    queryKey: [...keys.changes, id],
    queryFn: () => api<ChangeDetail>("/changes/" + id),
    enabled: staff,
  });
  const transition = useMutation({
    mutationFn: (note: string) =>
      send<ChangeDetail>("/changes/" + id + "/status", "PATCH", {
        version: q.data?.version,
        status: decision,
        note,
      }),
    onSuccess: async () => {
      setDecision(null);
      await client.invalidateQueries({ queryKey: keys.changes });
    },
  });
  if (!staff)
    return <ErrorState error={new Error("Bu alana erişim yetkiniz yok.")} />;
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const c = q.data,
    actor = session.data;
  const owner = c.requesterId === actor?.id || actor?.role === "ADMIN";
  const canApprove = actor?.role === "ADMIN" && c.requesterId !== actor.id;
  const actions: Change["status"][] =
    c.status === "DRAFT" && owner
      ? ["PENDING_APPROVAL"]
      : c.status === "PENDING_APPROVAL" && canApprove
        ? ["APPROVED", "REJECTED"]
        : c.status === "APPROVED" && owner
          ? ["SCHEDULED"]
          : c.status === "SCHEDULED" && owner
            ? ["IMPLEMENTED", "FAILED"]
            : c.status === "REJECTED" && owner
              ? ["DRAFT"]
              : [];
  const labels: Record<Change["status"], string> = {
    DRAFT: "Taslağa dön",
    PENDING_APPROVAL: "Onaya gönder",
    APPROVED: "Onayla",
    REJECTED: "Reddet",
    SCHEDULED: "Planlandı olarak işaretle",
    IMPLEMENTED: "Uygulamayı tamamla",
    FAILED: "Başarısız olarak kaydet",
  };
  const schema = z.object({
    note: z
      .string()
      .trim()
      .max(5000)
      .refine(
        (v) =>
          !decision ||
          !["REJECTED", "IMPLEMENTED", "FAILED"].includes(decision) ||
          v.length > 0,
        "Bu işlem için açıklama gerekli.",
      ),
  });
  return (
    <>
      <BackLink href="/changes">Değişikliklere dön</BackLink>
      <PageHeader
        title={c.title}
        description={`${c.code} · ${c.requesterName} tarafından oluşturuldu`}
        actions={
          <>
            {owner && ["DRAFT", "REJECTED"].includes(c.status) && (
              <Button variant="outline" onClick={() => setEdit(true)}>
                <Pencil />
                Düzenle
              </Button>
            )}
            {actions.map((a) => (
              <Button
                key={a}
                variant={
                  a === "REJECTED" || a === "FAILED" ? "destructive" : "default"
                }
                onClick={() => {
                  transition.reset();
                  setDecision(a);
                }}
              >
                {labels[a]}
              </Button>
            ))}
          </>
        }
      />
      <div className="detail-status-line">
        <Badge
          variant="secondary"
          className={"change-status-" + c.status.toLowerCase()}
        >
          {changeLabels[c.status]}
        </Badge>
        <Badge variant="outline" className={"risk-" + c.risk.toLowerCase()}>
          {c.risk === "HIGH"
            ? "Yüksek"
            : c.risk === "MEDIUM"
              ? "Orta"
              : "Düşük"}{" "}
          risk
        </Badge>
      </div>
      <div className="ticket-detail-layout">
        <div className="detail-main">
          {[
            ["Kapsam ve etki", c.description],
            ["Gerekçe", c.reason],
            ["Uygulama ve doğrulama planı", c.implementation],
            ["Geri dönüş planı", c.rollback],
          ].map(([title, body]) => (
            <section className="detail-section" key={title}>
              <h2>{title}</h2>
              <div className="prose-copy">{body}</div>
            </section>
          ))}
        </div>
        <aside className="detail-aside">
          <section className="detail-facts">
            <h2>
              <CalendarClock />
              Bakım aralığı
            </h2>
            <dl>
              <dt>Başlangıç</dt>
              <dd>{dateTime(c.plannedStart)}</dd>
              <dt>Bitiş</dt>
              <dd>{dateTime(c.plannedEnd)}</dd>
            </dl>
          </section>
          <section className="detail-facts">
            <h2>
              <ShieldCheck />
              Onay bilgisi
            </h2>
            <p>
              {c.approvedAt
                ? dateTime(c.approvedAt) + " tarihinde onaylandı."
                : "Henüz onaylanmadı."}
            </p>
            {c.decisionNote && <p className="prose-copy">{c.decisionNote}</p>}
            {c.status === "PENDING_APPROVAL" && !canApprove && (
              <p className="field-hint">
                Onay için talep sahibi dışında bir yönetici gerekli.
              </p>
            )}
          </section>
          <section className="detail-facts">
            <h2>
              <History />
              İşlem geçmişi
            </h2>
            <ol className="activity-list">
              {c.history.map((h) => (
                <li key={h.id}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{h.actorName}</strong>
                    <p>
                      {h.action === "STATUS_CHANGED"
                        ? changeLabels[h.details.after as Change["status"]] ||
                          "Durumu güncelledi"
                        : h.action === "CREATED"
                          ? "Taslağı oluşturdu"
                          : "Taslağı güncelledi"}
                    </p>
                    <time>{dateTime(h.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      {edit && <ChangeEditor change={c} onClose={() => setEdit(false)} />}
      {decision && (
        <FormDialog
          title={labels[decision]}
          description={`Mevcut durum: ${changeLabels[c.status]}. Bu işlem, kimliğin ve zaman bilgisiyle kaydedilecek.`}
          onClose={() => setDecision(null)}
          pending={transition.isPending}
        >
          <EntityForm
            schema={schema}
            initial={{ note: "" }}
            fields={[
              {
                name: "note",
                label: "Açıklama",
                type: "textarea",
                wide: true,
                required: ["REJECTED", "IMPLEMENTED", "FAILED"].includes(
                  decision,
                ),
              },
            ]}
            onSubmit={(data) => transition.mutate(data.note)}
            pending={transition.isPending}
            error={transition.error}
            submitLabel={labels[decision]}
            onCancel={() => setDecision(null)}
          />
        </FormDialog>
      )}
    </>
  );
}
