"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  changeSchema,
  type Change,
  type ChangeInput,
} from "@relaydesk/contracts";
import {
  EntityForm,
  FormDialog,
  type FieldDef,
} from "@/components/entity-form";
import { useReference } from "@/hooks/use-reference";
import { send, keys } from "@/lib/api";
import { localInput } from "@/lib/format";
const localDate = z
  .string()
  .min(1, "Tarih gerekli")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Geçerli bir tarih girin")
  .transform((v) => new Date(v).toISOString());
const schema = changeSchema.safeExtend({
  plannedStart: localDate,
  plannedEnd: localDate,
});
export function ChangeEditor({
  change,
  onClose,
}: {
  change?: Change;
  onClose: () => void;
}) {
  const client = useQueryClient(),
    router = useRouter(),
    ref = useReference();
  const save = useMutation({
    mutationFn: (body: ChangeInput) =>
      send<Change>(
        "/changes" + (change ? "/" + change.id : ""),
        change ? "PUT" : "POST",
        { ...body, ...(change ? { version: change.version } : {}) },
      ),
    onSuccess: async (data) => {
      await client.invalidateQueries({ queryKey: keys.changes });
      onClose();
      router.push("/changes/" + data.id);
    },
  });
  const fields: FieldDef[] = [
    { name: "title", label: "Değişiklik başlığı", wide: true, required: true },
    {
      name: "risk",
      label: "Risk",
      type: "select",
      options: [
        { value: "LOW", label: "Düşük" },
        { value: "MEDIUM", label: "Orta" },
        { value: "HIGH", label: "Yüksek" },
      ],
    },
    {
      name: "assetId",
      label: "Etkilenen varlık",
      type: "select",
      empty: "null",
      options: [
        { value: "", label: "Varlık seçilmedi" },
        ...(ref.data?.assets || []).map((a) => ({
          value: a.id,
          label: a.tag + " · " + a.name,
        })),
      ],
    },
    {
      name: "plannedStart",
      label: "Planlanan başlangıç",
      type: "datetime-local",
      required: true,
    },
    {
      name: "plannedEnd",
      label: "Planlanan bitiş",
      type: "datetime-local",
      required: true,
    },
    {
      name: "description",
      label: "Kapsam ve etki",
      type: "textarea",
      wide: true,
      required: true,
    },
    {
      name: "reason",
      label: "Değişikliğin gerekçesi",
      type: "textarea",
      wide: true,
      rows: 2,
      required: true,
    },
    {
      name: "implementation",
      label: "Uygulama ve doğrulama planı",
      type: "textarea",
      wide: true,
      rows: 4,
      required: true,
    },
    {
      name: "rollback",
      label: "Geri dönüş planı",
      type: "textarea",
      wide: true,
      rows: 4,
      required: true,
    },
  ];
  const initial = change
    ? {
        title: change.title,
        risk: change.risk,
        assetId: change.assetId,
        plannedStart: localInput(change.plannedStart),
        plannedEnd: localInput(change.plannedEnd),
        description: change.description,
        reason: change.reason,
        implementation: change.implementation,
        rollback: change.rollback,
      }
    : {
        title: "",
        risk: "MEDIUM" as const,
        assetId: null,
        plannedStart: localInput(new Date(Date.now() + 86400000).toISOString()),
        plannedEnd: localInput(new Date(Date.now() + 90000000).toISOString()),
        description: "",
        reason: "",
        implementation: "",
        rollback: "",
      };
  return (
    <FormDialog
      title={change ? "Değişikliği düzenle" : "Yeni değişiklik"}
      description="Kapsamı, bakım aralığını ve geri dönüş planını tamamla. Onay ayrı bir yönetici tarafından verilir."
      onClose={onClose}
      pending={save.isPending}
    >
      <EntityForm
        schema={schema}
        initial={initial}
        fields={fields}
        pending={save.isPending}
        error={save.error}
        onSubmit={(data) => save.mutate(data)}
        submitLabel="Taslağı kaydet"
        onCancel={onClose}
      />
    </FormDialog>
  );
}
