alter table public.bookings
  add column if not exists amount_due numeric(10, 2);

update public.bookings
set amount_due = coalesce(amount_due, amount_paid, 0)
where amount_due is null;

alter table public.bookings
  alter column amount_due set not null;

alter table public.bookings
  add column if not exists external_reference text;

update public.bookings
set external_reference = id::text
where external_reference is null;

alter table public.bookings
  alter column external_reference set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_external_reference_key'
  ) then
    alter table public.bookings
      add constraint bookings_external_reference_key unique (external_reference);
  end if;
end $$;

alter table public.bookings
  add column if not exists mercado_pago_preference_id text,
  add column if not exists mercado_pago_payment_id text;

alter table public.bookings
  alter column amount_paid drop not null,
  alter column amount_paid set default 0;

update public.bookings
set amount_paid = coalesce(amount_paid, 0)
where amount_paid is null;

alter table public.bookings
  alter column amount_paid set not null;

alter table public.bookings
  drop constraint if exists bookings_amount_paid_check,
  drop constraint if exists bookings_payment_status_check,
  drop constraint if exists bookings_booking_status_check;

alter table public.bookings
  alter column payment_status set default 'pending',
  alter column booking_status set default 'pending_payment';

update public.bookings
set payment_status = case
  when payment_status = 'paid' then 'approved'
  else coalesce(payment_status, 'pending')
end,
booking_status = case
  when booking_status = 'confirmed' then 'confirmed'
  else coalesce(booking_status, 'pending_payment')
end;

alter table public.bookings
  add constraint bookings_amount_paid_check
    check (amount_paid >= 0),
  add constraint bookings_payment_status_check
    check (payment_status in ('pending', 'approved', 'rejected')),
  add constraint bookings_booking_status_check
    check (booking_status in ('pending_payment', 'confirmed', 'cancelled'));
