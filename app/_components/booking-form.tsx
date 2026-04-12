"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import type { Barber, BookingRequestPayload, PaymentChoice, Service } from "@/lib/types";

type BookingFormProps = {
  barbers: Barber[];
  services: Service[];
};

const initialState = {
  barberId: "",
  serviceId: "",
  date: "",
  time: "",
  paymentChoice: "deposit" as PaymentChoice,
  notes: "",
};

export function BookingForm({ barbers, services }: BookingFormProps) {
  const { isSignedIn } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState(initialState);

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId),
    [form.serviceId, services],
  );

  const amountToPay = useMemo(() => {
    if (!selectedService) {
      return 0;
    }

    return form.paymentChoice === "deposit"
      ? selectedService.depositAmount
      : selectedService.price;
  }, [form.paymentChoice, selectedService]);

  useEffect(() => {
    const canLoadSlots = form.barberId && form.serviceId && form.date;

    if (!canLoadSlots) {
      setAvailableSlots([]);
      setForm((current) => ({ ...current, time: "" }));
      return;
    }

    let ignore = false;
    setIsLoadingSlots(true);
    setError("");

    fetch(
      `/api/availability?barberId=${form.barberId}&serviceId=${form.serviceId}&date=${form.date}`,
    )
      .then(async (response) => {
        const result = (await response.json()) as {
          slots?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "No pudimos consultar disponibilidad.");
        }

        if (ignore) {
          return;
        }

        setAvailableSlots(result.slots ?? []);
        setForm((current) => ({
          ...current,
          time:
            result.slots && result.slots.includes(current.time) ? current.time : "",
        }));
      })
      .catch((loadError) => {
        if (!ignore) {
          setAvailableSlots([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No pudimos consultar disponibilidad.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingSlots(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [form.barberId, form.serviceId, form.date]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSignedIn) {
      setError("Iniciá sesión para reservar y vincular el turno a tu cuenta.");
      setStatus("");
      return;
    }

    setError("");
    setStatus("");

    const payload: BookingRequestPayload = {
      barberId: form.barberId,
      serviceId: form.serviceId,
      date: form.date,
      time: form.time,
      paymentChoice: form.paymentChoice,
      notes: form.notes,
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          message?: string;
          error?: string;
          initPoint?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "No pudimos registrar la reserva.");
        }

        setStatus(
          result.message ?? "Reserva creada. Te vamos a redirigir a Mercado Pago.",
        );

        if (result.initPoint) {
          window.location.href = result.initPoint;
          return;
        }

        setForm(initialState);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Ocurrió un error inesperado.",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-[var(--color-muted)]">
          Barbero
          <select
            required
            value={form.barberId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                barberId: event.target.value,
                time: "",
              }))
            }
            className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] outline-none transition focus:border-[var(--color-accent-soft)]"
          >
            <option value="">Elegí un barbero</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-[var(--color-muted)]">
          Servicio
          <select
            required
            value={form.serviceId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                serviceId: event.target.value,
                time: "",
              }))
            }
            className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] outline-none transition focus:border-[var(--color-accent-soft)]"
          >
            <option value="">Elegí un servicio</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-[var(--color-muted)]">
          Fecha
          <input
            required
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                date: event.target.value,
                time: "",
              }))
            }
            className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] outline-none transition focus:border-[var(--color-accent-soft)]"
          />
        </label>

        <label className="space-y-2 text-sm text-[var(--color-muted)]">
          Horario disponible
          <select
            required
            value={form.time}
            onChange={(event) =>
              setForm((current) => ({ ...current, time: event.target.value }))
            }
            disabled={!availableSlots.length || isLoadingSlots}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] outline-none transition focus:border-[var(--color-accent-soft)] disabled:opacity-60"
          >
            <option value="">
              {isLoadingSlots
                ? "Buscando horarios..."
                : availableSlots.length
                  ? "Elegí un horario"
                  : "Sin horarios disponibles"}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            setForm((current) => ({ ...current, paymentChoice: "deposit" }))
          }
          className={`rounded-3xl border px-4 py-4 text-left transition ${
            form.paymentChoice === "deposit"
              ? "border-[var(--color-accent-soft)] bg-[var(--color-accent)]/10"
              : "border-[var(--color-line)] bg-black/10"
          }`}
        >
          <span className="block text-sm text-[var(--color-muted)]">
            Pago de seña
          </span>
          <strong className="mt-1 block text-lg text-[var(--color-cream)]">
            ${selectedService?.depositAmount.toLocaleString("es-AR") ?? "0"}
          </strong>
          <span className="mt-2 block text-xs uppercase tracking-[0.3em] text-[var(--color-accent-soft)]">
            Confirma el turno
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setForm((current) => ({ ...current, paymentChoice: "full" }))
          }
          className={`rounded-3xl border px-4 py-4 text-left transition ${
            form.paymentChoice === "full"
              ? "border-[var(--color-accent-soft)] bg-[var(--color-accent)]/10"
              : "border-[var(--color-line)] bg-black/10"
          }`}
        >
          <span className="block text-sm text-[var(--color-muted)]">
            Pago total
          </span>
          <strong className="mt-1 block text-lg text-[var(--color-cream)]">
            ${selectedService?.price.toLocaleString("es-AR") ?? "0"}
          </strong>
          <span className="mt-2 block text-xs uppercase tracking-[0.3em] text-[var(--color-accent-soft)]">
            Servicio cubierto
          </span>
        </button>
      </div>

      <label className="block space-y-2 text-sm text-[var(--color-muted)]">
        Notas para el barbero
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Ejemplo: degradé bajo, perfilar barba y evitar navaja."
          className="w-full rounded-3xl border border-[var(--color-line)] bg-black/20 px-4 py-3 text-[var(--color-cream)] outline-none transition focus:border-[var(--color-accent-soft)]"
        />
      </label>

      <div className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-4">
        <p className="text-sm text-[var(--color-muted)]">Monto a cobrar ahora</p>
        <p className="display-font mt-2 text-5xl text-[var(--color-cream)]">
          ${amountToPay.toLocaleString("es-AR")}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Solo mostramos horarios realmente disponibles para ese barbero y servicio.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-4 text-sm text-[var(--color-muted)]">
          Para reservar necesitás autenticarte con Clerk.
          <div className="mt-3">
            <SignInButton mode="modal">Iniciar sesión</SignInButton>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {status ? (
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {status}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !form.time}
        className="w-full rounded-full bg-[var(--color-accent)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </button>
    </form>
  );
}
