import { SERVICES } from "@/lib/mock-data";
import { getBookingStatusLabel } from "@/lib/data";
import type { Barber, BookingRecord, Weekday } from "@/lib/types";

type BarberDayCalendarProps = {
  barber: Barber | null;
  bookings: BookingRecord[];
};

function getWeekday(date: Date): Weekday {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Buenos_Aires",
  })
    .format(date)
    .toLowerCase() as Weekday;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function bookingColor(status: BookingRecord["bookingStatus"]) {
  if (status === "completed") return "bg-emerald-500/20 border-emerald-400/40";
  if (status === "no_show") return "bg-red-500/15 border-red-400/40";
  if (status === "cancelled") return "bg-zinc-500/15 border-zinc-400/30";
  if (status === "confirmed") return "bg-[var(--color-accent)]/20 border-[var(--color-accent-soft)]/40";
  return "bg-sky-500/15 border-sky-400/40";
}

export function BarberDayCalendar({
  barber,
  bookings,
}: BarberDayCalendarProps) {
  if (!barber) {
    return null;
  }

  const today = new Date();
  const weekday = getWeekday(today);
  const shift = barber.weeklySchedule[weekday];

  if (!shift) {
    return (
      <div className="rounded-3xl border border-[var(--color-line)] p-5 text-sm text-[var(--color-muted)]">
        Hoy no tenés horario configurado.
      </div>
    );
  }

  const startMinutes = toMinutes(shift.start);
  const endMinutes = toMinutes(shift.end);
  const totalMinutes = endMinutes - startMinutes;
  const hourMarks: string[] = [];

  for (let cursor = startMinutes; cursor <= endMinutes; cursor += 60) {
    const hours = String(Math.floor(cursor / 60)).padStart(2, "0");
    const minutes = String(cursor % 60).padStart(2, "0");
    hourMarks.push(`${hours}:${minutes}`);
  }

  return (
    <div className="rounded-[2rem] border border-[var(--color-line)] bg-black/10 p-4">
      <div className="relative h-[420px] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-black/20">
        {hourMarks.map((mark) => {
          const top = ((toMinutes(mark) - startMinutes) / totalMinutes) * 100;
          return (
            <div
              key={mark}
              className="absolute inset-x-0"
              style={{ top: `${top}%` }}
            >
              <div className="flex items-center gap-3 px-3">
                <span className="w-12 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {mark}
                </span>
                <div className="h-px flex-1 bg-[var(--color-line)]" />
              </div>
            </div>
          );
        })}

        {bookings.map((booking) => {
          const start = new Date(booking.startsAt);
          const startLabel = start.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Buenos_Aires",
          });
          const serviceMinutes =
            SERVICES.find((service) => service.id === booking.serviceId)?.durationMinutes ??
            60;
          const bookingStartMinutes = toMinutes(startLabel);
          const top =
            ((bookingStartMinutes - startMinutes) / totalMinutes) * 100;
          const height = (serviceMinutes / totalMinutes) * 100;

          return (
            <article
              key={booking.id}
              className={`absolute left-16 right-3 rounded-2xl border p-3 text-sm ${bookingColor(booking.bookingStatus)}`}
              style={{ top: `${top}%`, height: `${Math.max(height, 12)}%` }}
            >
              <p className="font-semibold text-[var(--color-cream)]">
                {startLabel} · {booking.serviceName}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                {getBookingStatusLabel(booking.bookingStatus)}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
