"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  MessageSquare,
  LockKeyhole,
  History,
  Clock3,
  Monitor,
  UserRound,
} from "lucide-react";
import {
  ticketUpdateSchema,
  commentSchema,
  statusLabels,
  type TicketDetail,
  type TicketUpdate,
  priorityFor,
} from "@relaydesk/contracts";
import { api, send, keys } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { useReference } from "@/hooks/use-reference";
import { dateTime, initials } from "@/lib/format";
import {
  PageHeader,
  ErrorState,
  Loading,
  BackLink,
  PriorityBadge,
  StatusBadge,
  Sla,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  EntityForm,
  FormDialog,
  type FieldDef,
} from "@/components/entity-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
const transitions = {
  NEW: ["NEW", "IN_PROGRESS", "PENDING"],
  IN_PROGRESS: ["IN_PROGRESS", "PENDING", "RESOLVED"],
  PENDING: ["PENDING", "IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["RESOLVED", "IN_PROGRESS", "CLOSED"],
  CLOSED: ["CLOSED"],
} as const;
export function TicketDetailView({
  id,
  returnTo = "/tickets",
}: {
  id: string;
  returnTo?: string;
}) {
  const session = useSession(),
    reference = useReference(),
    client = useQueryClient();
  const [edit, setEdit] = useState(false),
    [commentKey, setCommentKey] = useState(0);
  const q = useQuery({
    queryKey: [...keys.tickets, id],
    queryFn: () => api<TicketDetail>("/tickets/" + id),
  });
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: keys.tickets }),
      client.invalidateQueries({ queryKey: keys.dashboard }),
    ]);
  };
  const update = useMutation({
    mutationFn: (body: TicketUpdate) =>
      send<TicketDetail>("/tickets/" + id, "PATCH", body),
    onSuccess: async () => {
      setEdit(false);
      await invalidate();
    },
  });
  const comment = useMutation({
    mutationFn: (body: { body: string; internal: boolean }) =>
      send<TicketDetail>("/tickets/" + id + "/comments", "POST", body),
    onSuccess: async () => {
      setCommentKey((k) => k + 1);
      await invalidate();
    },
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const t = q.data,
    staff = session.data?.role !== "REQUESTER";
  const fields: FieldDef[] = [
    { name: "title", label: "Talep başlığı", wide: true, required: true },
    {
      name: "description",
      label: "Açıklama",
      type: "textarea",
      wide: true,
      required: true,
    },
    {
      name: "impact",
      label: "Etki",
      type: "select",
      options: [
        { value: "LOW", label: "Düşük" },
        { value: "MEDIUM", label: "Orta" },
        { value: "HIGH", label: "Yüksek" },
      ],
    },
    {
      name: "urgency",
      label: "Aciliyet",
      type: "select",
      options: [
        { value: "LOW", label: "Düşük" },
        { value: "MEDIUM", label: "Orta" },
        { value: "HIGH", label: "Yüksek" },
      ],
    },
    {
      name: "teamId",
      label: "Ekip",
      type: "select",
      empty: "null",
      options: [
        { value: "", label: "Ekip seçilmedi" },
        ...(reference.data?.teams || []).map((x) => ({
          value: x.id,
          label: x.name,
        })),
      ],
    },
    {
      name: "assigneeId",
      label: "Görevli",
      type: "select",
      empty: "null",
      options: [
        { value: "", label: "Atanmadı" },
        ...(reference.data?.agents || [])
          .filter((u) => u.role !== "REQUESTER")
          .map((u) => ({
            value: u.id,
            label:
              u.name +
              " · " +
              (reference.data?.teams.find((t) => t.id === u.teamId)?.name ||
                "Ekip yok"),
          })),
      ],
      hint: "Görevli seçilen ekibin üyesi olmalı.",
    },
    {
      name: "status",
      label: "Durum",
      type: "select",
      wide: true,
      options: transitions[t.status].map((s) => ({
        value: s,
        label: statusLabels[s],
      })),
    },
    {
      name: "resolution",
      label: "Çözüm açıklaması",
      type: "textarea",
      wide: true,
      hint: "Çözüldü durumuna geçerken zorunludur.",
    },
  ];
  return (
    <>
      <BackLink href={returnTo}>Talep kuyruğuna dön</BackLink>
      <PageHeader
        title={t.title}
        description={`${t.code} · ${t.type === "INCIDENT" ? "Olay" : "Hizmet talebi"} · ${t.category}`}
        actions={
          staff && t.status !== "CLOSED" ? (
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil />
              Talebi düzenle
            </Button>
          ) : undefined
        }
      />
      <div className="detail-status-line">
        <StatusBadge status={t.status} />
        <PriorityBadge priority={t.priority} />
        <span className="detail-created">
          {dateTime(t.createdAt)} tarihinde açıldı
        </span>
      </div>
      <div className="ticket-detail-layout">
        <div className="detail-main">
          <section className="detail-section">
            <h2>Açıklama</h2>
            <div className="prose-copy">{t.description}</div>
            {t.resolution && (
              <div className="resolution-note">
                <strong>Çözüm</strong>
                <p>{t.resolution}</p>
              </div>
            )}
          </section>
          <section className="detail-section">
            <Tabs defaultValue="conversation">
              <TabsList variant="line">
                <TabsTrigger value="conversation">
                  <MessageSquare />
                  Yazışmalar
                  <span className="tab-count">{t.comments.length}</span>
                </TabsTrigger>
                {staff && (
                  <TabsTrigger value="history">
                    <History />
                    İşlem geçmişi
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="conversation">
                <div className="conversation">
                  {!t.comments.length && (
                    <p className="subtle-message">
                      Henüz bir mesaj yok. İlk gelişmeyi burada paylaş.
                    </p>
                  )}
                  {t.comments.map((c) => (
                    <article
                      className={
                        "comment " + (c.internal ? "internal-comment" : "")
                      }
                      key={c.id}
                    >
                      <div className="comment-heading">
                        <span className="small-avatar">
                          {initials(c.authorName)}
                        </span>
                        <strong>{c.authorName}</strong>
                        {c.internal && (
                          <span className="internal-label">
                            <LockKeyhole size={12} />
                            İç not
                          </span>
                        )}
                        <time>{dateTime(c.createdAt)}</time>
                      </div>
                      <p>{c.body}</p>
                    </article>
                  ))}
                </div>
                {t.status !== "CLOSED" ? (
                  <div className="comment-editor">
                    <h3>Gelişme paylaş</h3>
                    <EntityForm
                      key={commentKey}
                      schema={commentSchema}
                      initial={{ body: "", internal: false }}
                      fields={[
                        {
                          name: "body",
                          label: "Mesaj",
                          type: "textarea",
                          rows: 4,
                          wide: true,
                          required: true,
                        },
                        ...(staff
                          ? [
                              {
                                name: "internal",
                                label: "İç not",
                                type: "checkbox" as const,
                                wide: true,
                                hint: "Yalnız destek ekibine görünür. Talep sahibi bu notu göremez.",
                              },
                            ]
                          : []),
                      ]}
                      onSubmit={(data) => comment.mutate(data)}
                      pending={comment.isPending}
                      error={comment.error}
                      submitLabel="Mesajı paylaş"
                    />
                  </div>
                ) : (
                  <p className="subtle-message">
                    Bu talep kapandı. Yeni bir konu için yeni talep açabilirsin.
                  </p>
                )}
              </TabsContent>
              {staff && (
                <TabsContent value="history">
                  <ol className="activity-list">
                    {t.history.map((h) => (
                      <li key={h.id}>
                        <span className="activity-dot" />
                        <div>
                          <strong>{h.actorName}</strong>
                          <p>
                            {h.action === "CREATED"
                              ? "Talebi oluşturdu"
                              : h.action === "INTERNAL_NOTE"
                                ? "İç not ekledi"
                                : h.action === "COMMENTED"
                                  ? "Mesaj paylaştı"
                                  : "Talebi güncelledi"}
                          </p>
                          <time>{dateTime(h.createdAt)}</time>
                        </div>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              )}
            </Tabs>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="detail-facts">
            <h2>
              <Clock3 />
              Hizmet hedefleri
            </h2>
            <Sla ticket={t} />
            <dl>
              <dt>İlk yanıt hedefi</dt>
              <dd>{dateTime(t.responseDueAt)}</dd>
              <dt>Çözüm hedefi</dt>
              <dd>{dateTime(t.resolutionDueAt)}</dd>
              <dt>İlk yanıt</dt>
              <dd>
                {t.firstResponseAt
                  ? dateTime(t.firstResponseAt)
                  : "Yanıt bekleniyor"}
              </dd>
            </dl>
            <p className="field-hint">
              7/24 geçen süre hesaplanır. Beklemede çözüm saati durur; mevcut
              SLA aşımı korunur.
            </p>
          </section>
          <section className="detail-facts">
            <h2>
              <UserRound />
              Sorumluluk
            </h2>
            <dl>
              <dt>Talep sahibi</dt>
              <dd>{t.requesterName}</dd>
              <dt>Görevli</dt>
              <dd>{t.assigneeName || "Atanmadı"}</dd>
              <dt>Ekip</dt>
              <dd>{t.teamName || "Ekip seçilmedi"}</dd>
              <dt>Etki / aciliyet</dt>
              <dd>
                {{ LOW: "Düşük", MEDIUM: "Orta", HIGH: "Yüksek" }[t.impact]} /{" "}
                {{ LOW: "Düşük", MEDIUM: "Orta", HIGH: "Yüksek" }[t.urgency]}
              </dd>
            </dl>
          </section>
          {t.assetName && (
            <section className="detail-facts">
              <h2>
                <Monitor />
                İlgili varlık
              </h2>
              <p>{t.assetName}</p>
            </section>
          )}
        </aside>
      </div>
      {edit && (
        <FormDialog
          title="Talebi düzenle"
          description="Etki ve aciliyet değişirse öncelik ve SLA hedefleri yeniden hesaplanır."
          onClose={() => setEdit(false)}
          pending={update.isPending}
        >
          <EntityForm
            key={t.version}
            schema={ticketUpdateSchema}
            initial={{
              version: t.version,
              title: t.title,
              description: t.description,
              impact: t.impact,
              urgency: t.urgency,
              status: t.status,
              teamId: t.teamId,
              assigneeId: t.assigneeId,
              resolution: t.resolution,
            }}
            fields={fields}
            onSubmit={(data) => update.mutate(data)}
            pending={update.isPending}
            error={update.error}
            onCancel={() => setEdit(false)}
          />
        </FormDialog>
      )}
    </>
  );
}
