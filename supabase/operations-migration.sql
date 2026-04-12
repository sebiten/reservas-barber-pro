create table if not exists public.barber_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default 'Bloqueo manual',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.bookings
  drop constraint if exists bookings_booking_status_check;

alter table public.bookings
  add constraint bookings_booking_status_check
    check (booking_status in ('pending_payment', 'confirmed', 'completed', 'no_show', 'cancelled'));
