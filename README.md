# BarberFlow

App de barbería en Next.js 16 con:

- Reservas por barbero
- Confirmación solo con seña o pago total
- Auth con Clerk
- Persistencia con Supabase
- Cobro con Mercado Pago

## Configuración

1. Copiá `.env.example` a `.env.local`.
2. Completá las credenciales de Clerk, Supabase y Mercado Pago.
3. Si ya habías creado la tabla `bookings`, ejecutá `supabase/mercadopago-migration.sql`.
4. Si tu base ya existe y querés roles internos, ejecutá `supabase/profiles-migration.sql`.
5. Si querés disponibilidad operativa y nuevos estados, ejecutá `supabase/operations-migration.sql`.
6. Para endurecer producción, ejecutá `supabase/production-hardening.sql`.
7. Si arrancás de cero, ejecutá `supabase/schema.sql`.
8. Configurá en Mercado Pago el webhook apuntando a `/api/mercadopago/webhook` o dejá que viaje en `notification_url` desde la preferencia.
9. Levantá la app con `pnpm dev`.

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
```

## Qué hace cada parte

### Clerk

Clerk se encarga solo de:

- login
- registro
- sesión del usuario

Clerk responde la pregunta: `quién es este usuario`.

### Supabase

Supabase guarda:

- perfiles internos
- reservas
- pagos
- bloqueos de agenda

Supabase responde la pregunta: `qué permisos tiene este usuario` y `qué datos de negocio maneja`.

## Cómo funcionan los roles

Los roles no viven en Clerk. Viven en la tabla `public.profiles`.

Cada vez que alguien entra al dashboard:

1. Clerk autentica al usuario.
2. La app toma su `userId`.
3. La app crea o sincroniza su fila en `public.profiles`.
4. Según `profiles.role`, muestra el panel correcto.

Roles disponibles:

- `client`: puede reservar y ver sus reservas
- `barber`: ve su agenda y puede operar sus turnos
- `admin`: ve todo y puede gestionar todas las reservas

## Cómo asignar roles

Primero, el usuario debe haber iniciado sesión al menos una vez para que exista en `public.profiles`.

Después podés promoverlo desde Supabase SQL Editor con comandos sql.

### Hacer admin a un usuario

```sql
update public.profiles
set role = 'admin'
where email = 'tu-admin@correo.com';
```

### Hacer barbero a un usuario

```sql
update public.profiles
set role = 'barber', barber_id = 'barber-lucho'
where email = 'barbero@correo.com';
```

Barberos disponibles por defecto:

- `barber-lucho`
- `barber-nico`
- `barber-santi`

### Volver un usuario a cliente

```sql
update public.profiles
set role = 'client', barber_id = null
where email = 'cliente@correo.com';
```

## Cómo probar cada perfil

### Cliente

1. Registrate o iniciá sesión con Clerk.
2. Entrá a `/dashboard`.
3. Vas a ver tu panel de cliente.
4. Probá reservar un turno y pagar con Mercado Pago.

### Barbero

1. Iniciá sesión con un usuario normal.
2. En Supabase cambiá su rol a `barber`.
3. Asignale un `barber_id`.
4. Volvé a `/dashboard`.
5. Vas a ver:
   - agenda simple
   - turnos del día
   - bloqueo de horarios
   - acciones como `realizado`, `no asistió` y `cancelar`

### Admin

1. Iniciá sesión con un usuario normal.
2. En Supabase cambiá su rol a `admin`.
3. Volvé a `/dashboard`.
4. Vas a ver:
   - reservas globales
   - métricas generales
   - confirmación manual
   - cancelación
   - reintento de pago
   - bloqueo de agenda para cualquier barbero

## Flujo actual

- La home permite elegir barbero, servicio, fecha, horario y tipo de pago.
- `POST /api/bookings` valida sesión con Clerk, crea la reserva pendiente y genera una preferencia de Mercado Pago.
- `/api/availability` devuelve solo slots realmente disponibles por barbero y servicio.
- `/api/mercadopago/webhook` confirma o deja pendiente la reserva según el estado real del pago.
- `/dashboard` cambia entre panel cliente, barbero y admin según `profiles.role`.
- Staff puede bloquear horarios y marcar turnos como realizados o ausentes.
- Si faltan variables de Supabase, la app entra en modo demo para que puedas ver el flujo igual.

## Tablas clave

- `profiles`: roles internos y relación con Clerk
- `barbers`: barberos disponibles
- `services`: servicios y precios
- `bookings`: reservas y estado del pago
- `barber_blocks`: bloqueos manuales de agenda

## Qué hace el panel admin

- ver reservas recientes
- confirmar manualmente una reserva
- cancelar una reserva
- marcar pagos pendientes para reintentar
- bloquear horarios de cualquier barbero

## Qué hace el panel barbero

- ver una agenda simple del día
- marcar turno como realizado
- marcar turno como `no_show`
- cancelar turno
- bloquear horarios propios

## Mercado Pago

Para probar el flujo real necesitás:

- `NEXT_PUBLIC_APP_URL` con una URL pública `https`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

Si estás en local, usá `ngrok` o similar.

## Producción

Checklist mínimo antes de salir:

- dominio real con `https`
- `NEXT_PUBLIC_APP_URL` apuntando al dominio final
- `MERCADOPAGO_WEBHOOK_SECRET` configurado
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor
- ejecutar `supabase/production-hardening.sql`
- probar una compra real de punta a punta
- verificar que el webhook actualiza `bookings` y escribe en `mercadopago_webhook_events`
- promover manualmente al menos un admin y un barbero en `profiles`
- revisar que no haya credenciales reales en `.env.example`

### Keepalive para Supabase Free

Si usás Supabase Free, el proyecto puede pausarse tras varios días de inactividad. Esta app incluye un endpoint de keepalive en `/api/keepalive` y un cron de Vercel en [vercel.json](C:/Users/Joaqoz/Desktop/my-app/vercel.json) para pegarle cada 3 días.

Configuración necesaria en Vercel:

```env
CRON_SECRET=un_secret_largo_y_random
```

El endpoint valida:

- header `Authorization: Bearer <CRON_SECRET>`
- acceso real a Supabase con una consulta mínima sobre `barbers`

Esto no choca con otros proyectos como Vitaespark:

- cada proyecto tiene su propio `vercel.json`
- cada proyecto define sus propios crons
- cada proyecto usa su propio `CRON_SECRET`

### Qué endurecí en esta versión

- validación de payloads con `zod`
- slots reales sin doble reserva
- webhook de Mercado Pago con deduplicación por `payment_id`
- tabla `mercadopago_webhook_events` para trazabilidad
- chequeos de seguridad de entorno para producción
- RLS activado en tablas críticas para negar acceso directo desde clientes

## Siguiente mejora recomendada

Si querés seguir creciendo la app, el próximo bloque fuerte sería:

- calendario semanal visual por barbero
- historial de pagos separado de reservas
- notificaciones por email o WhatsApp
- reglas más avanzadas de disponibilidad
