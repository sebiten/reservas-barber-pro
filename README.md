# BarberFlow

App de barbería en Next.js 16 con:

- Reservas por barbero
- Confirmación solo con seña o pago total
- Auth con Clerk
- Persistencia con Supabase
- Cobro con Mercado Pago
- Emails transaccionales

## Configuración

1. Completá tus variables de entorno.
2. Si ya habías creado `bookings`, ejecutá `supabase/mercadopago-migration.sql`.
3. Si tu base ya existe y querés roles internos, ejecutá `supabase/profiles-migration.sql`.
4. Si querés disponibilidad operativa y nuevos estados, ejecutá `supabase/operations-migration.sql`.
5. Para endurecer producción, ejecutá `supabase/production-hardening.sql`.
6. Si arrancás de cero, ejecutá `supabase/schema.sql`.
7. Configurá en Mercado Pago el webhook apuntando a `/api/mercadopago/webhook`.
8. Levantá la app con `pnpm dev`.

## Variables importantes

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

## Cómo funciona Clerk y los roles

Clerk se encarga de:

- login
- registro
- sesión

Clerk responde: `quién es este usuario`.

Los roles no viven en Clerk. Viven en Supabase, en `public.profiles`.

La app hace esto:

1. Clerk autentica al usuario.
2. La app toma su `userId`.
3. La app crea o sincroniza su fila en `public.profiles`.
4. Según `profiles.role`, muestra el panel correcto.

Roles disponibles:

- `client`
- `barber`
- `admin`

## Cómo asignar roles

Primero, el usuario debe iniciar sesión al menos una vez.

### Hacer admin

```sql
update public.profiles
set role = 'admin'
where email = 'tu-admin@correo.com';
```

### Hacer barbero

```sql
update public.profiles
set role = 'barber', barber_id = 'barber-lucho'
where email = 'barbero@correo.com';
```

### Volver a cliente

```sql
update public.profiles
set role = 'client', barber_id = null
where email = 'cliente@correo.com';
```

Barberos por defecto:

- `barber-lucho`
- `barber-nico`
- `barber-santi`

## Qué hace cada panel

### Cliente

- reservar turno
- pagar con Mercado Pago
- ver reservas
- reintentar pago

### Barbero

- ver agenda visual del día
- marcar turno como realizado
- marcar turno como `no_show`
- cancelar turno
- bloquear horarios propios

### Admin

- ver reservas globales
- confirmar manualmente
- cancelar reservas
- reintentar pago
- bloquear horarios de cualquier barbero

## Flujo actual

- La home permite elegir barbero, servicio, fecha, horario y tipo de pago.
- `/api/availability` devuelve slots realmente disponibles.
- `POST /api/bookings` crea la reserva pendiente y genera la preferencia de Mercado Pago.
- `/api/mercadopago/webhook` confirma o deja pendiente la reserva según el pago real.
- `/dashboard` cambia entre panel cliente, barbero y admin según `profiles.role`.
- Staff puede bloquear horarios y marcar turnos como realizados o ausentes.
- La app envía email al crear una reserva y al aprobarse el pago.

## Tablas clave

- `profiles`
- `barbers`
- `services`
- `bookings`
- `barber_blocks`
- `mercadopago_webhook_events`

## Mercado Pago

Necesitás:

- `NEXT_PUBLIC_APP_URL` con una URL pública `https`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

En local, usá `ngrok` o similar.

## Emails

La app ya envía:

- email de reserva creada
- email de pago aprobado

Variables:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Servicio recomendado para este MVP:

- Resend

## Producción

Checklist mínimo:

- dominio real con `https`
- `NEXT_PUBLIC_APP_URL` apuntando al dominio final
- `MERCADOPAGO_WEBHOOK_SECRET` configurado
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor
- ejecutar `supabase/production-hardening.sql`
- probar compra real end to end
- verificar que el webhook actualiza `bookings`
- verificar que escribe en `mercadopago_webhook_events`
- promover manualmente al menos un admin y un barbero

## Qué endurecí

- validación de payloads con `zod`
- slots reales sin doble reserva
- webhook de Mercado Pago con deduplicación por `payment_id`
- trazabilidad de webhook
- chequeos de seguridad de entorno para producción
- RLS activado para negar acceso directo desde clientes
