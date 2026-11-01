"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  articleSchema,
  type Article,
  type ArticleInput,
} from "@relaydesk/contracts";
import { api, send, keys } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Search, BookOpen, ArrowUpRight } from "lucide-react";
import { dateTime } from "@/lib/format";
export function KnowledgeView() {
  const session = useSession(),
    client = useQueryClient();
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("Tümü"),
    [selected, setSelected] = useState<Article | null>(null),
    [editor, setEditor] = useState<Article | "new" | null>(null);
  const query = useQuery({
    queryKey: keys.articles,
    queryFn: () => api<Article[]>("/articles"),
  });
  const save = useMutation({
    mutationFn: (body: ArticleInput) =>
      send<Article>(
        "/articles" + (editor && editor !== "new" ? "/" + editor.id : ""),
        editor === "new" ? "POST" : "PUT",
        {
          ...body,
          ...(editor && editor !== "new" ? { version: editor.version } : {}),
        },
      ),
    onSuccess: async () => {
      setEditor(null);
      setSelected(null);
      await client.invalidateQueries({ queryKey: keys.articles });
    },
  });
  const fields: FieldDef[] = [
    { name: "title", label: "Başlık", wide: true, required: true },
    { name: "category", label: "Kategori", wide: true, required: true },
    {
      name: "summary",
      label: "Kısa özet",
      type: "textarea",
      rows: 2,
      wide: true,
      required: true,
    },
    {
      name: "body",
      label: "İçerik",
      type: "textarea",
      rows: 10,
      wide: true,
      required: true,
      hint: "Adımları açıkça yaz. İçerik güvenli düz metin olarak gösterilir.",
    },
    {
      name: "published",
      label: "Yayın durumu",
      type: "checkbox",
      wide: true,
      hint: "Yayınla: makale tüm çalışanlara görünür. Taslak yalnız destek ekibine görünür.",
    },
  ];
  const initial =
    editor && editor !== "new"
      ? {
          title: editor.title,
          category: editor.category,
          summary: editor.summary,
          body: editor.body,
          published: editor.published,
        }
      : {
          title: "",
          category: "Genel",
          summary: "",
          body: "",
          published: false,
        };
  const cats = ["Tümü", ...new Set(query.data?.map((a) => a.category) || [])];
  const rows =
    query.data?.filter(
      (a) =>
        (category === "Tümü" || a.category === category) &&
        (a.title + " " + a.summary + " " + a.body)
          .toLocaleLowerCase("tr")
          .includes(q.toLocaleLowerCase("tr")),
    ) || [];
  return (
    <>
      <PageHeader
        title="Bilgi bankası"
        description="Tekrarlayan sorunlar için anlaşılır, erişilebilir çözümler."
        actions={
          session.data?.role !== "REQUESTER" ? (
            <Button
              onClick={() => {
                save.reset();
                setEditor("new");
              }}
            >
              <Plus />
              Makale oluştur
            </Button>
          ) : undefined
        }
      />
      <div className="knowledge-tools">
        <div className="local-search">
          <Search size={16} />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nasıl yardımcı olabiliriz?"
            aria-label="Bilgi bankasında ara"
          />
        </div>
        <div
          className="category-filters"
          role="group"
          aria-label="Makale kategorisi"
        >
          {cats.map((c) => (
            <Button
              key={c}
              variant={category === c ? "secondary" : "ghost"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : !rows.length ? (
        <Empty
          title="Makale bulunamadı"
          description="Aramayı veya kategoriyi değiştirebilirsin."
        />
      ) : (
        <div className="knowledge-grid">
          {rows.map((a) => (
            <article className="knowledge-card" key={a.id}>
              <div className="knowledge-category">
                <BookOpen size={18} />
                {a.category}
                {!a.published && <Badge variant="outline">Taslak</Badge>}
              </div>
              <h2>
                <button onClick={() => setSelected(a)}>{a.title}</button>
              </h2>
              <p>{a.summary}</p>
              <div className="knowledge-bottom">
                <span>
                  {a.authorName} · {dateTime(a.updatedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={a.title + " makalesini oku"}
                  onClick={() => setSelected(a)}
                >
                  <ArrowUpRight />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setSelected(null);
          }}
        >
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {selected.category} · {selected.authorName}
              </DialogDescription>
            </DialogHeader>
            <div className="article-content">{selected.body}</div>
            {session.data?.role !== "REQUESTER" && (
              <Button
                variant="outline"
                onClick={() => {
                  save.reset();
                  setEditor(selected);
                  setSelected(null);
                }}
              >
                <Pencil />
                Makaleyi düzenle
              </Button>
            )}
          </DialogContent>
        </Dialog>
      )}
      {editor && (
        <FormDialog
          title={editor === "new" ? "Makale oluştur" : "Makaleyi düzenle"}
          description="Yayınlamadan önce bilgilerin güncel ve paylaşılabilir olduğundan emin ol."
          pending={save.isPending}
          onClose={() => setEditor(null)}
        >
          <EntityForm
            schema={articleSchema}
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
