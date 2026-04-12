import Link from "next/link";

const messages = {
  success: {
    title: "Pago recibido",
    description:
      "Si Mercado Pago ya aprobó la operación, el webhook va a confirmar tu turno automáticamente.",
  },
  pending: {
    title: "Pago pendiente",
    description:
      "Tu reserva quedó creada, pero sigue esperando la confirmación de Mercado Pago.",
  },
  failure: {
    title: "Pago no completado",
    description:
      "No se acreditó el pago. Podés volver a intentar desde la home y generar una nueva reserva.",
  },
} as const;

export default async function CheckoutStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current =
    messages[(status as keyof typeof messages) ?? "pending"] ?? messages.pending;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <div className="glass-card w-full max-w-2xl rounded-[2rem] p-8 text-center">
        <p className="display-font text-6xl text-[var(--color-cream)]">
          {current.title}
        </p>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
          {current.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-accent)] px-5 py-3 font-semibold text-black"
          >
            Ver mi panel
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--color-line)] px-5 py-3 text-[var(--color-cream)]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
