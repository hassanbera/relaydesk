"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetSchema, type Asset, type AssetInput } from "@relaydesk/contracts";
import { api, send, keys } from "@/lib/api";
import { useReference } from "@/hooks/use-reference";
import { useSession } from "@/hooks/use-session";
import {
  EntityForm,
  FormDialog,
  type FieldDef,
} from "@/components/entity-form";
import { PageHeader, ErrorState, Loading, Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Plus, Pencil, Search, Monitor } from "lucide-react";
const types = {
  LAPTOP: "Dizüstü",
  DESKTOP: "Masaüstü",
  SERVER: "Sunucu",
  NETWORK: "Ağ",
  SOFTWARE: "Yazılım",
  OTHER: "Diğer",
};
const states = {
  IN_USE: "Kullanımda",
  AVAILABLE: "Boşta",
  MAINTENANCE: "Bakımda",
  RETIRED: "Kullanım dışı",
};
export function AssetsView() {
  const session = useSession(),
    ref = useReference(),
    client = useQueryClient();
  const [q, setQ] = useState(""),
    [editor, setEditor] = useState<Asset | "new" | null>(null);
  const query = useQuery({
    queryKey: keys.assets,
    queryFn: () => api<Asset[]>("/assets"),
  });
  const save = useMutation({
    mutationFn: (body: AssetInput) =>
      send<Asset>(
        "/assets" + (editor && editor !== "new" ? "/" + editor.id : ""),
        editor === "new" ? "POST" : "PUT",
        {
          ...body,
          ...(editor && editor !== "new" ? { version: editor.version } : {}),
        },
      ),
    onSuccess: async () => {
      setEditor(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.assets }),
        client.invalidateQueries({ queryKey: keys.reference }),
      ]);
    },
  });
  const fields: FieldDef[] = [
    { name: "name", label: "Varlık adı", wide: true, required: true },
    { name: "tag", label: "Envanter etiketi", required: true },
    {
      name: "type",
      label: "Tür",
      type: "select",
      options: Object.entries(types).map(([value, label]) => ({
        value,
        label,
      })),
    },
    { name: "serial", label: "Seri numarası" },
    {
      name: "status",
      label: "Durum",
      type: "select",
      options: Object.entries(states).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      name: "ownerId",
      label: "Atanan kullanıcı",
      type: "select",
      empty: "null",
      options: [
        { value: "", label: "Atanmadı" },
        ...(ref.data?.agents || []).map((u) => ({
          value: u.id,
          label: u.name,
        })),
      ],
      hint: "Boşta veya kullanım dışı varlıklarda kullanıcı ataması bırakma.",
    },
    { name: "location", label: "Konum" },
    { name: "notes", label: "Notlar", type: "textarea", wide: true },
  ];
  const initial =
    editor && editor !== "new"
      ? {
          name: editor.name,
          tag: editor.tag,
          type: editor.type,
          serial: editor.serial,
          status: editor.status,
          ownerId: editor.ownerId,
          location: editor.location,
          notes: editor.notes,
        }
      : {
          name: "",
          tag: "",
          type: "LAPTOP" as const,
          serial: "",
          status: "AVAILABLE" as const,
          ownerId: null,
          location: "",
          notes: "",
        };
  const rows =
    query.data?.filter((a) =>
      (a.name + " " + a.tag + " " + (a.ownerName || "") + " " + a.location)
        .toLocaleLowerCase("tr")
        .includes(q.toLocaleLowerCase("tr")),
    ) || [];
  return (
    <>
      <PageHeader
        title="Varlık envanteri"
        description={
          session.data?.role === "REQUESTER"
            ? "Sana atanmış cihazlar ve yazılımlar."
            : "Cihazları, yazılımları ve sorumlularını birlikte takip et."
        }
        actions={
          session.data?.role !== "REQUESTER" ? (
            <Button
              onClick={() => {
                save.reset();
                setEditor("new");
              }}
            >
              <Plus />
              Varlık ekle
            </Button>
          ) : undefined
        }
      />
      <section className="work-surface">
        <div className="resource-toolbar">
          <div className="local-search">
            <Search size={16} />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Varlık, etiket veya kullanıcı ara…"
              aria-label="Envanterde ara"
            />
          </div>
          <span>{rows.length} varlık</span>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : !rows.length ? (
          <Empty
            title="Varlık bulunamadı"
            description="Aramanı değiştir veya envantere bir varlık ekle."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Varlık</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>
                  <span className="sr-only">İşlem</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="asset-name">
                      <Monitor size={20} />
                      <div>
                        <strong>{a.name}</strong>
                        <span>
                          {a.tag} {a.serial ? "· " + a.serial : ""}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{types[a.type]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{states[a.status]}</Badge>
                  </TableCell>
                  <TableCell>{a.ownerName || "Atanmadı"}</TableCell>
                  <TableCell>{a.location || "—"}</TableCell>
                  <TableCell>
                    {session.data?.role !== "REQUESTER" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={a.tag + " düzenle"}
                        onClick={() => {
                          save.reset();
                          setEditor(a);
                        }}
                      >
                        <Pencil />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      {editor && (
        <FormDialog
          title={editor === "new" ? "Varlık ekle" : "Varlığı düzenle"}
          description="Envanter etiketi benzersiz olmalı. Atamalar talep ekranındaki varlıklarla ilişkilidir."
          pending={save.isPending}
          onClose={() => setEditor(null)}
        >
          <EntityForm
            schema={assetSchema}
            initial={initial}
            fields={fields}
            pending={save.isPending}
            error={save.error}
            onSubmit={(data) => save.mutate(data)}
            onCancel={() => setEditor(null)}
          />
        </FormDialog>
      )}
    </>
  );
}
