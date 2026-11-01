"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userCreateSchema,
  userUpdateSchema,
  teamSchema,
  policySchema,
  catalogSchema,
  roleLabels,
  type User,
  type Team,
  type Policy,
  type Catalog,
} from "@relaydesk/contracts";
import { api, send, keys } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { PageHeader, Loading, ErrorState } from "@/components/common";
import {
  EntityForm,
  FormDialog,
  type FieldDef,
} from "@/components/entity-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Users, Clock3, Layers3, UsersRound } from "lucide-react";
type Editor =
  | { kind: "user"; item?: User }
  | { kind: "team"; item?: Team }
  | { kind: "policy"; item: Policy }
  | { kind: "catalog"; item?: Catalog };
export function SettingsView() {
  const session = useSession(),
    client = useQueryClient(),
    [editor, setEditor] = useState<Editor | null>(null);
  const q = useQuery({
    queryKey: keys.settings,
    queryFn: () => api<Settings>("/settings"),
    enabled: session.data?.role === "ADMIN",
  });
  const save = useMutation({
    mutationFn: (v: { path: string; method: string; body: unknown }) =>
      send(v.path, v.method, v.body),
    onSuccess: async () => {
      setEditor(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.settings }),
        client.invalidateQueries({ queryKey: keys.reference }),
        client.invalidateQueries({ queryKey: keys.session }),
        client.invalidateQueries({ queryKey: keys.assets }),
      ]);
    },
  });
  const open = (e: Editor) => {
    save.reset();
    setEditor(e);
  };
  if (session.data?.role !== "ADMIN")
    return (
      <ErrorState error={new Error("Bu sayfa yalnız yöneticilere açıktır.")} />
    );
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const d = q.data,
    teams = [
      { value: "", label: "Ekip seçilmedi" },
      ...d.teams.map((t) => ({ value: t.id, label: t.name })),
    ];
  const userFields: FieldDef[] = [
    { name: "name", label: "Ad soyad", wide: true, required: true },
    {
      name: "role",
      label: "Rol",
      type: "select",
      options: Object.entries(roleLabels).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      name: "teamId",
      label: "Destek ekibi",
      type: "select",
      options: teams,
      empty: "null",
    },
  ];
  const catalogFields: FieldDef[] = [
    { name: "name", label: "Hizmet adı", wide: true, required: true },
    {
      name: "description",
      label: "Açıklama",
      type: "textarea",
      wide: true,
      required: true,
    },
    { name: "category", label: "Kategori", required: true },
    {
      name: "teamId",
      label: "Varsayılan ekip",
      type: "select",
      options: teams,
      required: true,
    },
    {
      name: "active",
      label: "Yayın durumu",
      type: "checkbox",
      wide: true,
      hint: "Aktif hizmetler katalogda görünür ve yeni taleplerde seçilebilir.",
    },
  ];
  return (
    <>
      <PageHeader
        title="Yönetim"
        description="Erişimleri, ekipleri, hizmetleri ve yeni taleplerin SLA hedeflerini yönet."
      />
      <Tabs defaultValue="users">
        <div className="settings-tabs">
          <TabsList>
            <TabsTrigger value="users">
              <Users />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="teams">
              <UsersRound />
              Ekipler
            </TabsTrigger>
            <TabsTrigger value="sla">
              <Clock3 />
              SLA politikaları
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Layers3 />
              Katalog
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="users">
          <section className="work-surface">
            <div className="section-title surface-title">
              <div>
                <h2>Kullanıcılar</h2>
                <p>Çalışan, destek uzmanı ve yönetici erişimleri.</p>
              </div>
              <Button onClick={() => open({ kind: "user" })}>
                <Plus />
                Kullanıcı ekle
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>
                    <span className="sr-only">İşlem</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      {d.teams.find((t) => t.id === u.teamId)?.name || "—"}
                    </TableCell>
                    <TableCell>{u.active ? "Aktif" : "Pasif"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={u.name + " kullanıcısını düzenle"}
                        onClick={() => open({ kind: "user", item: u })}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="teams">
          <section className="work-surface">
            <div className="section-title surface-title">
              <h2>Destek ekipleri</h2>
              <Button onClick={() => open({ kind: "team" })}>
                <Plus />
                Ekip ekle
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ekip</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Aktif üye</TableHead>
                  <TableHead>
                    <span className="sr-only">İşlem</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.teams.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      {
                        d.users.filter((u) => u.teamId === t.id && u.active)
                          .length
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.name + " ekibini düzenle"}
                        onClick={() => open({ kind: "team", item: t })}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="sla">
          <section className="work-surface">
            <div className="section-title surface-title">
              <div>
                <h2>SLA politikaları</h2>
                <p>
                  7/24 geçen süre, dakika cinsinden. Değişiklikler yeni
                  taleplere ve önceliği değiştirilen kayıtlara uygulanır.
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>İlk yanıt</TableHead>
                  <TableHead>Çözüm</TableHead>
                  <TableHead>
                    <span className="sr-only">İşlem</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">
                      {p.priority}
                    </TableCell>
                    <TableCell>{p.responseMinutes} dakika</TableCell>
                    <TableCell>{p.resolutionMinutes} dakika</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => open({ kind: "policy", item: p })}
                      >
                        <Pencil />
                        Düzenle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="catalog">
          <section className="work-surface">
            <div className="section-title surface-title">
              <h2>Hizmet kataloğu</h2>
              <Button onClick={() => open({ kind: "catalog" })}>
                <Plus />
                Hizmet ekle
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hizmet</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Varsayılan ekip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>
                    <span className="sr-only">İşlem</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.catalog.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <strong>{c.name}</strong>
                      <p className="cell-description">{c.description}</p>
                    </TableCell>
                    <TableCell>{c.category}</TableCell>
                    <TableCell>
                      {d.teams.find((t) => t.id === c.teamId)?.name}
                    </TableCell>
                    <TableCell>{c.active ? "Aktif" : "Pasif"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={c.name + " hizmetini düzenle"}
                        onClick={() => open({ kind: "catalog", item: c })}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
      </Tabs>
      {editor && (
        <FormDialog
          title={
            editor.kind === "policy"
              ? editor.item.priority + " SLA politikasını düzenle"
              : editor.kind === "user"
                ? editor.item
                  ? "Kullanıcıyı düzenle"
                  : "Kullanıcı ekle"
                : editor.kind === "team"
                  ? editor.item
                    ? "Ekibi düzenle"
                    : "Ekip ekle"
                  : editor.item
                    ? "Hizmeti düzenle"
                    : "Hizmet ekle"
          }
          description={
            editor.kind === "user"
              ? "Rol değişiklikleri API tarafından uygulanır. Pasifleştirilen kullanıcının oturumları kapatılır."
              : "Bilgiler aynı çalışma alanındaki kayıtlarla birlikte kullanılır."
          }
          onClose={() => setEditor(null)}
          pending={save.isPending}
        >
          {editor.kind === "user" ? (
            editor.item ? (
              <EntityForm
                schema={userUpdateSchema}
                initial={{
                  name: editor.item.name,
                  role: editor.item.role,
                  teamId: editor.item.teamId,
                  active: editor.item.active,
                }}
                fields={[
                  ...userFields,
                  {
                    name: "active",
                    label: "Hesap durumu",
                    type: "checkbox",
                    wide: true,
                    hint: "Aktif hesap giriş yapabilir.",
                  },
                ]}
                pending={save.isPending}
                error={save.error}
                onSubmit={(body) =>
                  save.mutate({
                    path: "/users/" + editor.item!.id,
                    method: "PUT",
                    body,
                  })
                }
                onCancel={() => setEditor(null)}
              />
            ) : (
              <EntityForm
                schema={userCreateSchema}
                initial={{
                  name: "",
                  email: "",
                  password: "",
                  role: "REQUESTER",
                  teamId: null,
                }}
                fields={[
                  userFields[0],
                  {
                    name: "email",
                    label: "E-posta",
                    type: "email",
                    wide: true,
                    required: true,
                  },
                  ...userFields.slice(1),
                  {
                    name: "password",
                    label: "İlk parola",
                    type: "password",
                    wide: true,
                    required: true,
                    hint: "En az 12 karakter. Kullanıcıyla güvenli bir kanaldan paylaş.",
                  },
                ]}
                pending={save.isPending}
                error={save.error}
                onSubmit={(body) =>
                  save.mutate({ path: "/users", method: "POST", body })
                }
                onCancel={() => setEditor(null)}
              />
            )
          ) : editor.kind === "team" ? (
            <EntityForm
              schema={teamSchema}
              initial={{
                name: editor.item?.name || "",
                description: editor.item?.description || "",
              }}
              fields={[
                { name: "name", label: "Ekip adı", wide: true, required: true },
                {
                  name: "description",
                  label: "Açıklama",
                  type: "textarea",
                  wide: true,
                },
              ]}
              pending={save.isPending}
              error={save.error}
              onSubmit={(body) =>
                save.mutate({
                  path: "/teams" + (editor.item ? "/" + editor.item.id : ""),
                  method: editor.item ? "PUT" : "POST",
                  body,
                })
              }
              onCancel={() => setEditor(null)}
            />
          ) : editor.kind === "policy" ? (
            <EntityForm
              schema={policySchema}
              initial={{
                responseMinutes: editor.item.responseMinutes,
                resolutionMinutes: editor.item.resolutionMinutes,
              }}
              fields={[
                {
                  name: "responseMinutes",
                  label: "İlk yanıt süresi (dakika)",
                  type: "number",
                  min: 1,
                  required: true,
                },
                {
                  name: "resolutionMinutes",
                  label: "Çözüm süresi (dakika)",
                  type: "number",
                  min: 1,
                  required: true,
                },
              ]}
              pending={save.isPending}
              error={save.error}
              onSubmit={(body) =>
                save.mutate({
                  path: "/policies/" + editor.item.id,
                  method: "PUT",
                  body,
                })
              }
              onCancel={() => setEditor(null)}
            />
          ) : (
            <EntityForm
              schema={catalogSchema}
              initial={{
                name: editor.item?.name || "",
                description: editor.item?.description || "",
                category: editor.item?.category || "Genel",
                teamId: editor.item?.teamId || d.teams[0]?.id || "",
                active: editor.item?.active ?? true,
              }}
              fields={catalogFields}
              pending={save.isPending}
              error={save.error}
              onSubmit={(body) =>
                save.mutate({
                  path: "/catalog" + (editor.item ? "/" + editor.item.id : ""),
                  method: editor.item ? "PUT" : "POST",
                  body,
                })
              }
              onCancel={() => setEditor(null)}
            />
          )}
        </FormDialog>
      )}
    </>
  );
}
