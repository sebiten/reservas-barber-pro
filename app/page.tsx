import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BookingForm } from "@/app/_components/booking-form";
import { BARBERS, SERVICES } from "@/lib/mock-data";

const benefits = [
  "Cada barbero maneja su propia agenda y disponibilidad.",
  "La reserva solo se confirma con una seña o con el pago total.",
  "Clerk protege el acceso del cliente y Supabase persiste turnos y pagos.",
];

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
      <header className="glass-card sticky top-4 z-20 flex items-center justify-between rounded-full px-5 py-3">
        <div>
          <p className="display-font text-2xl text-[var(--color-accent-soft)]">
            BarberFlow
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Reservas premium
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="#reservar"
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-cream)] transition hover:border-[var(--color-accent-soft)] hover:text-white"
          >
            Reservar
          </Link>
          {!isSignedIn ? (
            <SignInButton mode="modal"

            >
              <span className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[var(--color-accent-soft)]">
                Ingresar
              </span>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[var(--color-accent-soft)]"
              >
               Perfil
              </Link>
              <UserButton />
            </div>
          )}
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-[var(--color-line)] px-3 py-1 text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Next.js 16 + Clerk + Supabase
          </div>
          <div className="space-y-5">
            <p className="display-font text-6xl leading-none text-[var(--color-cream)] sm:text-7xl">
              Tu barbería, con agenda por barbero y pagos que aseguran el turno.
            </p>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Diseñada para que cada cliente elija barbero, servicio, horario y
              cómo quiere pagar: seña o total. Sin pago, no hay confirmación.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit}
                className="glass-card rounded-3xl p-4 text-sm leading-6 text-[var(--color-muted)]"
              >
                {benefit}
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-soft)] to-transparent" />
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="display-font text-4xl text-[var(--color-cream)]">
                Equipo
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Cada profesional con su estilo y agenda.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] px-3 py-2 text-right text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Reserva segura
            </div>
          </div>
          <div className="space-y-4">
            {BARBERS.map((barber) => (
              <article
                key={barber.id}
                className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-cream)]">
                      {barber.name}
                    </h2>
                    <p className="text-sm text-[var(--color-accent-soft)]">
                      {barber.specialty}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    {barber.shiftLabel}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {barber.bio}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 pb-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="display-font text-4xl text-[var(--color-cream)]">
            Servicios
          </p>
          <div className="mt-6 space-y-4">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-[var(--color-line)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-cream)]">
                    {service.name}
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    {service.durationMinutes} min
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {service.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[var(--color-accent-soft)]">
                    Seña: ${service.depositAmount.toLocaleString("es-AR")}
                  </span>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-cream)]">
                    Total: ${service.price.toLocaleString("es-AR")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div id="reservar" className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Reservá ahora
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              El formulario ya diferencia pago de seña y pago total. El endpoint
              queda listo para conectarlo a una pasarela real como Mercado Pago o Stripe.
            </p>
          </div>
          <BookingForm barbers={BARBERS} services={SERVICES} />
        </div>
      </section>
    </main>
  );
}
