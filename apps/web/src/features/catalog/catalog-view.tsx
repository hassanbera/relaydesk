"use client";
import { useState } from "react";
import { Layers3, ArrowRight } from "lucide-react";
import { useReference } from "@/hooks/use-reference";
import { PageHeader, Loading, ErrorState, Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
import { NewTicket } from "@/features/tickets/new-ticket";
export function CatalogView() {
  const ref = useReference(),
    [id, setId] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        title="Hizmet kataloğu"
        description="İhtiyacına uygun hizmeti seç. Talebin ilgili destek ekibine yönlensin."
      />
      {ref.isPending ? (
        <Loading />
      ) : ref.error ? (
        <ErrorState error={ref.error} retry={() => ref.refetch()} />
      ) : !ref.data.catalog.length ? (
        <Empty
          title="Henüz bir hizmet yok"
          description="BT yöneticin hizmetleri katalogda yayınladığında burada görünecek."
        />
      ) : (
        <div className="catalog-grid">
          {ref.data.catalog.map((c) => (
            <article className="catalog-card" key={c.id}>
              <span className="catalog-icon">
                <Layers3 size={24} />
              </span>
              <span className="catalog-category">{c.category}</span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <div className="catalog-team">
                {ref.data.teams.find((t) => t.id === c.teamId)?.name}
              </div>
              <Button variant="outline" onClick={() => setId(c.id)}>
                Talep oluştur
                <ArrowRight />
              </Button>
            </article>
          ))}
        </div>
      )}
      {id && <NewTicket catalogId={id} onClose={() => setId(null)} />}
    </>
  );
}
