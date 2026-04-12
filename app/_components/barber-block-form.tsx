"use client";

import { useState, useTransition } from "react";
import type { Barber } from "@/lib/types";

type BarberBlockFormProps = {
  barbers: Barber[];
  defaultBarberId?: string | null;
};

export function BarberBlockForm({
  barbers,
  defaultBarberId,
}: BarberBlockFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    barberId: defaultBarberId ?? barbers[0]?.id ?? "",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        startTransition(async () => {
          try {
            const response = await fetch("/api/barber-blocks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const result = (await response.json()) as { error?: string };

            if (!response.ok) {
              throw new Error(result.error ?? "No pudimos crear el bloqueo.");
            }

            setStatus("Bloqueo guardado.");
            setForm((current) => ({
              ...current,
              date: "",
              startTime: "",
              endTime: "",
              reason: "",
            }));
            window.location.reload();
          } catch (submitError) {
            setError(
              submitError instanceof Error
                ? submitError.message
                : "Error inesperado.",
            );
          }
        });
      }}
    >
      <label className="block space-y-2 text-sm text-[var(--color-muted)]">
        Barbero
        <select
          value={form.barberId}
          onChange={(event) =>
            setForm((current) => ({ ...current, barberId: event.target.value }))
          }
          disabled={Boolean(defaultBarberId)}
          className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] disabled:opacity-60"
        >
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          required
          type="date"
          value={form.date}
          onChange={(event) =>
            setForm((current) => ({ ...current, date: event.target.value }))
          }
          className="rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)]"
        />
        <input
          required
          type="time"
          value={form.startTime}
          onChange={(event) =>
            setForm((current) => ({ ...current, startTime: event.target.value }))
          }
          className="rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)]"
        />
        <input
          required
          type="time"
          value={form.endTime}
          onChange={(event) =>
            setForm((current) => ({ ...current, endTime: event.target.value }))
          }
          className="rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)]"
        />
      </div>
      <input
        type="text"
        value={form.reason}
        onChange={(event) =>
          setForm((current) => ({ ...current, reason: event.target.value }))
        }
        placeholder="Motivo: almuerzo, licencia, capacitación..."
        className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)]"
      />
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {status ? <p className="text-sm text-emerald-200">{status}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Bloquear horario"}
      </button>
    </form>
  );
}
