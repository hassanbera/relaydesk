"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ticketCreateSchema,
  type Ticket,
  type TicketCreate,
} from "@relaydesk/contracts";
import {
  EntityForm,
  FormDialog,
  type FieldDef,
} from "@/components/entity-form";
import { Loading, ErrorState } from "@/components/common";
import { useReference } from "@/hooks/use-reference";
import { useSession } from "@/hooks/use-session";
import { send, keys } from "@/lib/api";
export function NewTicket({
  onClose,
  catalogId,
}: {
  onClose: () => void;
  catalogId?: string;
}) {
  const router = useRouter(),
    client = useQueryClient(),
    reference = useReference(),
    session = useSession();
  const create = useMutation({
    mutationFn: (data: TicketCreate) => send<Ticket>("/tickets", "POST", data),
    onSuccess: async (data) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.tickets }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]);
      onClose();
      router.push("/tickets/" + data.id);
    },
  });
  const fields: FieldDef[] = [
    { name: "title", label: "Talep başlığı", wide: true, required: true },
    {
      name: "type",
      label: "Kayıt türü",
      type: "select",
      options: [
        { value: "INCIDENT", label: "Olay / kesinti" },
        { value: "REQUEST", label: "Hizmet talebi" },
      ],
    },
    {
      name: "catalogId",
      label: "İlgili hizmet",
      type: "select",
      empty: "undefined",
      options: [
        { value: "", label: "Genel olay / hizmet seçilmedi" },
        ...(reference.data?.catalog || []).map((c) => ({
          value: c.id,
          label: c.name,
        })),
      ],
      hint: "Hizmet taleplerinde bir katalog hizmeti seçin.",
    },
    {
      name: "impact",
      label: "Etki",
      type: "select",
      options: [
        { value: "LOW", label: "Düşük · Tek kullanıcı" },
        { value: "MEDIUM", label: "Orta · Bir ekip" },
        { value: "HIGH", label: "Yüksek · Kurum geneli" },
      ],
    },
    {
      name: "urgency",
      label: "Aciliyet",
      type: "select",
      options: [
        { value: "LOW", label: "Düşük · Alternatif çözüm var" },
        { value: "MEDIUM", label: "Orta · İş kısmen etkileniyor" },
        { value: "HIGH", label: "Yüksek · İş durdu" },
      ],
    },
    {
      name: "assetId",
      label: "İlgili varlık",
      type: "select",
      empty: "undefined",
      wide: true,
      options: [
        { value: "", label: "Varlık seçilmedi" },
        ...(reference.data?.assets || [])
          .filter((a) => a.status !== "RETIRED")
          .map((a) => ({ value: a.id, label: a.tag + " · " + a.name })),
      ],
    },
    {
      name: "description",
      label: "Açıklama",
      type: "textarea",
      wide: true,
      rows: 5,
      required: true,
      hint: "Ne oldu, kimler etkileniyor ve hangi adımları denediniz? Parola veya gizli anahtar paylaşmayın.",
    },
  ];
  if (session.data?.role !== "REQUESTER")
    fields.splice(6, 0, {
      name: "teamId",
      label: "Atanacak ekip",
      type: "select",
      empty: "undefined",
      wide: true,
      options: [
        { value: "", label: "Hizmetin varsayılan ekibi" },
        ...(reference.data?.teams || []).map((t) => ({
          value: t.id,
          label: t.name,
        })),
      ],
    });
  return (
    <FormDialog
      title="Yeni talep"
      description="Etki ve aciliyet, önceliği ve SLA hedeflerini birlikte belirler."
      onClose={onClose}
      pending={create.isPending}
    >
      {reference.isPending ? (
        <Loading />
      ) : reference.error ? (
        <ErrorState error={reference.error} retry={() => reference.refetch()} />
      ) : (
        <EntityForm
          schema={ticketCreateSchema}
          initial={{
            title: "",
            description: "",
            type: catalogId ? "REQUEST" : "INCIDENT",
            impact: "MEDIUM",
            urgency: "MEDIUM",
            catalogId,
          }}
          fields={fields}
          pending={create.isPending}
          error={create.error}
          onSubmit={(data) => create.mutate(data)}
          submitLabel="Talebi oluştur"
          onCancel={onClose}
        />
      )}
    </FormDialog>
  );
}
