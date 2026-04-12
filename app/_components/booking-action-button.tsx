"use client";

import { useState, useTransition } from "react";

type BookingActionButtonProps = {
  bookingId: string;
  action: "confirm" | "cancel" | "complete" | "no_show";
  children: React.ReactNode;
};

export function BookingActionButton({
  bookingId,
  action,
  children,
}: BookingActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            try {
              const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
              });

              const result = (await response.json()) as { error?: string };

              if (!response.ok) {
                throw new Error(result.error ?? "No pudimos actualizar la reserva.");
              }

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
        className="rounded-full border border-[var(--color-line)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--color-cream)] disabled:opacity-50"
      >
        {isPending ? "Procesando..." : children}
      </button>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
