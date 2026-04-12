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

drop policy if exists "deny_profiles_all" on public.profiles;
drop policy if exists "deny_bookings_all" on public.bookings;
drop policy if exists "deny_barber_blocks_all" on public.barber_blocks;
drop policy if exists "deny_barbers_all" on public.barbers;
drop policy if exists "deny_services_all" on public.services;
drop policy if exists "deny_mp_webhooks_all" on public.mercadopago_webhook_events;

create policy "deny_profiles_all" on public.profiles for all to authenticated using (false) with check (false);
create policy "deny_bookings_all" on public.bookings for all to authenticated using (false) with check (false);
create policy "deny_barber_blocks_all" on public.barber_blocks for all to authenticated using (false) with check (false);
create policy "deny_barbers_all" on public.barbers for all to authenticated using (false) with check (false);
create policy "deny_services_all" on public.services for all to authenticated using (false) with check (false);
create policy "deny_mp_webhooks_all" on public.mercadopago_webhook_events for all to authenticated using (false) with check (false);
