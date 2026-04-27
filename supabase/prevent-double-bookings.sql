create unique index if not exists bookings_unique_active_slot
  on public.bookings (barber_id, starts_at)
  where booking_status in ('pending_payment', 'confirmed', 'completed');
