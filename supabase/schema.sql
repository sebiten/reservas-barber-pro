create extension if not exists "pgcrypto";

create table if not exists public.barbers (
  id text primary key,
  name text not null,
  specialty text not null,
  shift_label text not null,
  bio text not null
);

create table if not exists public.profiles (
  clerk_user_id text primary key,
  email text not null,
  display_name text not null,
  role text not null default 'client' check (role in ('client', 'barber', 'admin')),
  barber_id text references public.barbers(id),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id text primary key,
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  deposit_amount numeric(10, 2) not null check (deposit_amount >= 0)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers(id),
  service_id text not null references public.services(id),
  clerk_user_id text not null,
  starts_at timestamptz not null,
  payment_choice text not null check (payment_choice in ('deposit', 'full')),
  amount_due numeric(10, 2) not null check (amount_due > 0),
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  external_reference text not null unique,
  mercado_pago_preference_id text,
  mercado_pago_payment_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'approved', 'rejected')),
  booking_status text not null default 'pending_payment' check (booking_status in ('pending_payment', 'confirmed', 'completed', 'no_show', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.barber_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default 'Bloqueo manual',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.mercadopago_webhook_events (
  payment_id text primary key,
  external_reference text not null,
  payment_status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.barber_blocks enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.mercadopago_webhook_events enable row level security;

insert into public.barbers (id, name, specialty, shift_label, bio)
values
  ('barber-lucho', 'Lucho Vargas', 'Fade preciso + barba clásica', 'Lun a Vie 10:00 - 19:00', 'Especialista en degradados limpios y terminaciones prolijas para clientes de rutina semanal.'),
  ('barber-nico', 'Nico Roldán', 'Cortes largos + textura', 'Mar a Sáb 11:00 - 20:00', 'Ideal para estilos modernos, volumen, textura y asesoramiento integral de look.'),
  ('barber-santi', 'Santi Quiroga', 'Perfilado premium + ritual', 'Mié a Dom 12:00 - 21:00', 'Enfocado en experiencia premium con toalla caliente, perfilado y cuidado de barba.')
on conflict (id) do nothing;

insert into public.services (id, name, description, duration_minutes, price, deposit_amount)
values
  ('service-fade', 'Fade + styling', 'Corte con degradé, lavado rápido y acabado con producto.', 45, 22000, 8000),
  ('service-beard', 'Barba premium', 'Perfilado, toalla caliente y tratamiento hidratante.', 30, 16000, 6000),
  ('service-full', 'Corte + barba', 'Servicio completo con asesoría de estilo y acabado premium.', 60, 30000, 10000)
on conflict (id) do nothing;
