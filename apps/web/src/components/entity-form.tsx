"use client";
import {
  useForm,
  Controller,
  type DefaultValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ErrorState } from "./common";
export interface FieldDef {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "datetime-local";
  options?: { value: string; label: string }[];
  hint?: string;
  wide?: boolean;
  empty?: "undefined" | "null";
  min?: number;
  max?: number;
  rows?: number;
  required?: boolean;
  autoComplete?: string;
}
export function EntityForm<S extends z.ZodObject>({
  schema,
  initial,
  fields,
  onSubmit,
  pending,
  error,
  submitLabel = "Kaydet",
  onCancel,
}: {
  schema: S;
  initial: DefaultValues<z.input<S>>;
  fields: FieldDef[];
  onSubmit: (data: z.output<S>) => void;
  pending: boolean;
  error?: unknown;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  // The generic object-schema overload widens input/output; S remains the form contract.
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema) as unknown as Resolver<
      z.input<S>,
      unknown,
      z.output<S>
    >,
    defaultValues: initial,
  });
  return (
    <form
      className="entity-form"
      onSubmit={handleSubmit((data) => {
        if (!pending) onSubmit(data);
      })}
      noValidate
    >
      {error ? <ErrorState error={error} /> : null}
      <div className="form-grid">
        {fields.map((f, i) => {
          const name = f.name as Path<z.input<S>>;
          const registration =
            f.type === "checkbox"
              ? undefined
              : f.type === "number"
                ? register(name, { valueAsNumber: true })
                : register(name, {
                    setValueAs: (v) =>
                      v === "" && f.empty === "undefined"
                        ? undefined
                        : v === "" && f.empty === "null"
                          ? null
                          : v,
                  });
          const message = errors[name]?.message;
          return (
            <div
              className={"field " + (f.wide ? "field-wide" : "")}
              key={f.name}
            >
              <Label htmlFor={"field-" + f.name}>
                {f.label}
                {f.required ? <span className="required-mark">*</span> : null}
              </Label>
              {f.type === "checkbox" ? (
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <div className="checkbox-field">
                      <Checkbox
                        id={"field-" + f.name}
                        aria-describedby={"help-" + f.name}
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      <span id={"help-" + f.name}>{f.hint}</span>
                    </div>
                  )}
                />
              ) : f.type === "textarea" ? (
                <Textarea
                  id={"field-" + f.name}
                  rows={f.rows || 4}
                  aria-invalid={!!message}
                  aria-describedby={
                    message || f.hint ? "help-" + f.name : undefined
                  }
                  {...registration}
                />
              ) : f.type === "select" ? (
                <NativeSelect
                  id={"field-" + f.name}
                  aria-invalid={!!message}
                  aria-describedby={
                    message || f.hint ? "help-" + f.name : undefined
                  }
                  className="w-full"
                  {...registration}
                >
                  {f.options?.map((o) => (
                    <NativeSelectOption key={o.value} value={o.value}>
                      {o.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <Input
                  id={"field-" + f.name}
                  type={f.type || "text"}
                  autoComplete={f.autoComplete}
                  min={f.min}
                  max={f.max}
                  autoFocus={i === 0}
                  aria-invalid={!!message}
                  aria-describedby={
                    message || f.hint ? "help-" + f.name : undefined
                  }
                  {...registration}
                />
              )}{" "}
              {typeof message === "string" ? (
                <p id={"help-" + f.name} className="field-error" role="alert">
                  {message}
                </p>
              ) : f.hint && f.type !== "checkbox" ? (
                <small id={"help-" + f.name} className="field-hint">
                  {f.hint}
                </small>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Vazgeç
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
export function FormDialog({
  title,
  description,
  children,
  onClose,
  pending = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
  pending?: boolean;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
