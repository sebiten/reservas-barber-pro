create table if not exists public.profiles (
  clerk_user_id text primary key,
  email text not null,
  display_name text not null,
  role text not null default 'client' check (role in ('client', 'barber', 'admin')),
  barber_id text references public.barbers(id),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Relaciona usuarios de Clerk con roles internos de la app.';
