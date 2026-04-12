import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BarberBlockForm } from "@/app/_components/barber-block-form";
import { BarberDayCalendar } from "@/app/_components/barber-day-calendar";
import { BookingActionButton } from "@/app/_components/booking-action-button";
import { RetryPaymentButton } from "@/app/_components/retry-payment-button";
import {
  getBarberOptions,
  getBookingStatusLabel,
  getDashboardData,
  getRoleLabel,
} from "@/lib/data";

function shellHeader(title: string, subtitle: string, roleLabel: string) {
  return (
    <header className="glass-card flex flex-col gap-4 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="display-font text-5xl text-[var(--color-cream)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">
          {roleLabel}
        </span>
        <Link
          href="/"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-cream)]"
        >
          Inicio
        </Link>
        <UserButton />
      </div>
    </header>
  );
}

function renderEmptyState() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <div className="glass-card max-w-xl rounded-[2rem] p-8">
        <p className="display-font text-5xl text-[var(--color-cream)]">
          Tu panel espera por vos
        </p>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
          Iniciá sesión con Clerk para ver turnos, pagos y próximas visitas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 font-semibold text-black"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return renderEmptyState();
  }

  const data = await getDashboardData(userId);
  const roleLabel = getRoleLabel(data.profile.role);
  const barbers = getBarberOptions();

  if (data.view === "admin") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8">
        {shellHeader(
          "Panel admin",
          "Control total de agenda, pagos y rendimiento por barbero.",
          roleLabel,
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Reservas totales
            </p>
            <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
              {data.stats.totalBookings}
            </p>
          </article>
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Pagos aprobados
            </p>
            <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
              {data.stats.approvedBookings}
            </p>
          </article>
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Pendientes
            </p>
            <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
              {data.stats.pendingPayments}
            </p>
          </article>
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Facturación
            </p>
            <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
              ${data.stats.revenueApproved.toLocaleString("es-AR")}
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-card rounded-[2rem] p-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Reservas recientes
            </p>
            <div className="mt-6 space-y-4">
              {data.recentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-cream)]">
                        {booking.serviceName}
                      </h2>
                      <p className="text-sm text-[var(--color-accent-soft)]">
                        {booking.barberName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--color-muted)]">
                      <p>{booking.startsAtLabel}</p>
                      <p className="uppercase tracking-[0.2em]">
                        {getBookingStatusLabel(booking.bookingStatus)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-cream)]">
                      {booking.paymentStatus === "approved"
                        ? `$${booking.amountPaid.toLocaleString("es-AR")} aprobado`
                        : `$${booking.amountDue.toLocaleString("es-AR")} pendiente`}
                    </span>
                    <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[var(--color-accent-soft)]">
                      {booking.paymentChoice === "deposit" ? "Seña" : "Total"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {booking.paymentStatus !== "approved" &&
                    booking.bookingStatus !== "cancelled" ? (
                      <>
                        <BookingActionButton bookingId={booking.id} action="confirm">
                          Confirmar manual
                        </BookingActionButton>
                        <RetryPaymentButton bookingId={booking.id} />
                      </>
                    ) : null}
                    {booking.bookingStatus !== "cancelled" ? (
                      <BookingActionButton bookingId={booking.id} action="cancel">
                        Cancelar
                      </BookingActionButton>
                    ) : null}
                    {booking.bookingStatus === "confirmed" ? (
                      <>
                        <BookingActionButton bookingId={booking.id} action="complete">
                          Marcar realizado
                        </BookingActionButton>
                        <BookingActionButton bookingId={booking.id} action="no_show">
                          No asistió
                        </BookingActionButton>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="glass-card rounded-[2rem] p-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Equipo
            </p>
            <div className="mt-6 space-y-4">
              {data.byBarber.map((item) => (
                <article
                  key={item.barber.id}
                  className="rounded-3xl border border-[var(--color-line)] p-5"
                >
                  <h2 className="text-lg font-semibold text-[var(--color-cream)]">
                    {item.barber.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Turnos: {item.totalBookings} · Confirmados: {item.confirmedBookings}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Pendientes de pago: {item.pendingPayments}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--color-line)] pt-6">
              <p className="display-font text-3xl text-[var(--color-cream)]">
                Bloqueo manual
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Quitá horarios del calendario para descansos o ausencias.
              </p>
              <div className="mt-4">
                <BarberBlockForm barbers={barbers} />
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (data.view === "barber") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8">
        {shellHeader(
          "Panel barbero",
          `Tu agenda simple para ${data.barber?.name ?? data.profile.displayName}.`,
          roleLabel,
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Turnos de hoy
            </p>
            <p className="display-font mt-2 text-4xl text-[var(--color-cream)]">
              {data.stats.totalToday}
            </p>
          </article>
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Pendientes
            </p>
            <p className="display-font mt-2 text-4xl text-[var(--color-cream)]">
              {data.stats.pendingPayments}
            </p>
          </article>
          <article className="glass-card rounded-[2rem] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Cobrado
            </p>
            <p className="display-font mt-2 text-4xl text-[var(--color-cream)]">
              ${data.stats.revenueApproved.toLocaleString("es-AR")}
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[2rem] p-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Agenda de hoy
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Solo lo importante: horario, servicio, estado y acción.
            </p>
            <div className="mt-6">
              <BarberDayCalendar barber={data.barber} bookings={data.todayBookings} />
            </div>
            <div className="mt-6 space-y-3">
              {(data.todayBookings.length ? data.todayBookings : data.bookings.slice(0, 6)).map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--color-cream)]">
                        {booking.serviceName}
                      </h2>
                      <p className="text-sm text-[var(--color-accent-soft)]">
                        {booking.startsAtLabel}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      {getBookingStatusLabel(booking.bookingStatus)}
                    </span>
                  </div>
                  {booking.notes ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      {booking.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.bookingStatus === "confirmed" ? (
                      <>
                        <BookingActionButton bookingId={booking.id} action="complete">
                          Marcar realizado
                        </BookingActionButton>
                        <BookingActionButton bookingId={booking.id} action="no_show">
                          No asistió
                        </BookingActionButton>
                      </>
                    ) : null}
                    {booking.bookingStatus !== "cancelled" ? (
                      <BookingActionButton bookingId={booking.id} action="cancel">
                        Cancelar
                      </BookingActionButton>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="glass-card rounded-[2rem] p-6">
            <p className="display-font text-4xl text-[var(--color-cream)]">
              Disponibilidad
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Bloqueá horarios cuando no quieras recibir reservas.
            </p>
            <div className="mt-6 border-t border-[var(--color-line)] pt-6">
              <p className="display-font text-3xl text-[var(--color-cream)]">
                Bloquear horario
              </p>
              <div className="mt-4">
                <BarberBlockForm barbers={barbers} defaultBarberId={data.profile.barberId} />
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8">
      {shellHeader(
        "Mi panel",
        `Seguimiento de reservas y pagos de ${data.profile.displayName}.`,
        roleLabel,
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="glass-card rounded-[2rem] p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Próximo turno
          </p>
          <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
            {data.nextBookingLabel}
          </p>
        </article>
        <article className="glass-card rounded-[2rem] p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Pagado
          </p>
          <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
            ${data.totalPaid.toLocaleString("es-AR")}
          </p>
        </article>
        <article className="glass-card rounded-[2rem] p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Turnos activos
          </p>
          <p className="display-font mt-3 text-4xl text-[var(--color-cream)]">
            {data.bookings.length}
          </p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card rounded-[2rem] p-6">
          <p className="display-font text-4xl text-[var(--color-cream)]">
            Mis reservas
          </p>
          <div className="mt-6 space-y-4">
            {data.bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-3xl border border-[var(--color-line)] bg-black/20 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-cream)]">
                      {booking.serviceName}
                    </h2>
                    <p className="text-sm text-[var(--color-accent-soft)]">
                      {booking.barberName}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--color-muted)]">
                    <p>{booking.startsAtLabel}</p>
                    <p className="uppercase tracking-[0.2em]">
                      {getBookingStatusLabel(booking.bookingStatus)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[var(--color-accent-soft)]">
                    Pago: {booking.paymentChoice === "deposit" ? "Seña" : "Total"}
                  </span>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-cream)]">
                    {booking.paymentStatus === "approved"
                      ? `$${booking.amountPaid.toLocaleString("es-AR")} pagado`
                      : `$${booking.amountDue.toLocaleString("es-AR")} pendiente`}
                  </span>
                </div>
                {booking.paymentStatus !== "approved" &&
                booking.bookingStatus !== "cancelled" ? (
                  <div className="mt-4">
                    <RetryPaymentButton bookingId={booking.id} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <aside className="glass-card rounded-[2rem] p-6">
          <p className="display-font text-4xl text-[var(--color-cream)]">
            Estado técnico
          </p>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-[var(--color-muted)]">
            <li>Roles resueltos desde `profiles` en Supabase.</li>
            <li>Clientes, barberos y admins comparten login con Clerk.</li>
            <li>Mercado Pago confirma el cobro por webhook antes de cerrar la reserva.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
