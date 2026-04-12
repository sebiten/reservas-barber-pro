"use client";

import { useState, useTransition } from "react";

type RetryPaymentButtonProps = {
  bookingId: string;
};

export function RetryPaymentButton({ bookingId }: RetryPaymentButtonProps) {
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
              const response = await fetch(
                `/api/bookings/${bookingId}/retry-payment`,
                { method: "POST" },
              );

              const result = (await response.json()) as {
                error?: string;
                initPoint?: string;
              };

              if (!response.ok || !result.initPoint) {
                throw new Error(result.error ?? "No pudimos generar el pago.");
              }

              window.location.href = result.initPoint;
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : "Error inesperado.",
              );
            }
          });
        }}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black disabled:opacity-50"
      >
        {isPending ? "Generando..." : "Reintentar pago"}
      </button>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
