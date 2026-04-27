import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BookingForm } from "@/app/_components/booking-form";
import { BARBERS, SERVICES } from "@/lib/mock-data";

const benefits = [
  "Turnos confirmados con seña o pago total.",
  "Horarios reales por barbero, sin idas y vueltas.",
  "Recordá tu reserva y reintentá el pago desde tu perfil.",
];

const stats = [
  { value: "3", label: "barberos especialistas" },
  { value: "30 min", label: "bloques de agenda" },
  { value: "$300", label: "seña de prueba" },
];

const workSamples = [
  {
    title: "Fade limpio",
    barber: "Lucho Vargas",
    detail: "Laterales bajos, transición suave y terminación con styling.",
    image:
      "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Barba premium",
    barber: "Nico Roldán",
    detail: "Perfilado marcado, hidratación y acabado natural.",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Corte + barba",
    barber: "Santi Quiroga",
    detail: "Look completo para salir listo del sillón.",
    image:
      "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=900&q=80",
  },
];

const experienceSteps = [
  "Elegís profesional",
  "Ves horarios disponibles",
  "Pagás seña o total",
  "Llegás con tu turno confirmado",
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
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="#trabajos"
            className="hidden rounded-full border border-transparent px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-white sm:inline-flex"
          >
            Trabajos
          </Link>
          <Link
            href="#servicios"
            className="hidden rounded-full border border-transparent px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-white sm:inline-flex"
          >
            Servicios
          </Link>
          <Link
            href="#reservar"
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-cream)] transition hover:border-[var(--color-accent-soft)] hover:text-white"
          >
            Reservar
          </Link>
          {!isSignedIn ? (
            <SignInButton mode="modal">
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
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-soft)]">
              Barbería premium con reserva online
            </p>
            <h1 className="display-font max-w-4xl text-6xl leading-none text-[var(--color-cream)] sm:text-7xl">
              Cortes prolijos, barbas cuidadas y turnos confirmados al instante.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Elegí tu barbero, mirá horarios reales y asegurá tu lugar con
              seña o pago total. Menos mensajes, más sillón listo para vos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="#reservar"
              className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[var(--color-accent-soft)]"
            >
              Reservar ahora
            </Link>
            <Link
              href="#trabajos"
              className="rounded-full border border-[var(--color-line)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cream)] transition hover:border-[var(--color-accent-soft)]"
            >
              Ver trabajos
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <article
                key={item.label}
                className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-4"
              >
                <strong className="display-font block text-4xl text-[var(--color-cream)]">
                  {item.value}
                </strong>
                <span className="mt-1 block text-sm text-[var(--color-muted)]">
                  {item.label}
                </span>
              </article>
            ))}
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

      <section id="trabajos" className="pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="display-font text-5xl text-[var(--color-cream)]">
              Trabajos recientes
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Mostrá estilos reales, detalles de terminación y el barbero ideal
              para cada look.
            </p>
          </div>
          <Link
            href="#reservar"
            className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cream)] transition hover:border-[var(--color-accent-soft)]"
          >
            Quiero este nivel
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {workSamples.map((work) => (
            <article
              key={work.title}
              className="min-h-[360px] overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-cover bg-center"
              style={{ backgroundImage: `url(${work.image})` }}
            >
              <div className="flex min-h-[360px] flex-col justify-end bg-gradient-to-t from-black via-black/45 to-transparent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-soft)]">
                  {work.barber}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {work.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-cream)]">
                  {work.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 pb-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div id="servicios" className="glass-card rounded-[2rem] p-6 sm:p-8">
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

        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="display-font text-4xl text-[var(--color-cream)]">
            Cómo se vive el turno
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
            Una experiencia simple desde el celular hasta la silla: elegís,
            pagás y llegás con todo coordinado.
          </p>
          <div className="mt-6 grid gap-3">
            {experienceSteps.map((step, index) => (
              <article
                key={step}
                className="flex items-center gap-4 rounded-3xl border border-[var(--color-line)] bg-black/20 p-4"
              >
                <span className="display-font flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl text-black">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-[var(--color-cream)]">
                    {step}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Sin llamadas ni esperas: el sistema ordena disponibilidad,
                    pagos y confirmaciones.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div id="reservar" className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Reservá ahora
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Elegí barbero, servicio, fecha y horario. Podés pagar seña o
              total para dejar tu turno asegurado.
            </p>
          </div>
          <BookingForm barbers={BARBERS} services={SERVICES} />
        </div>
      </section>
    </main>
  );
}
