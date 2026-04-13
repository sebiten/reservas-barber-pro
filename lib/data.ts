import { clerkClient } from "@clerk/nextjs/server";
import { sendBookingPendingEmail, sendPaymentApprovedEmail } from "@/lib/email";
import { BARBERS, MOCK_BOOKINGS, SERVICES } from "@/lib/mock-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import type {
  Barber,
  BarberBlock,
  BookingRecord,
  BookingRequestPayload,
  BookingStatus,
  PaymentStatus,
  UserProfile,
  UserRole,
  Weekday,
} from "@/lib/types";

type BookingRow = {
  id: string;
  barber_id: string;
  service_id: string;
  clerk_user_id: string;
  starts_at: string;
  payment_choice: "deposit" | "full";
  amount_due?: number | string;
  amount_paid?: number | string;
  notes?: string | null;
  external_reference?: string | null;
  mercado_pago_preference_id?: string | null;
  mercado_pago_payment_id?: string | null;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
};

type ProfileRow = {
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  barber_id?: string | null;
};

type BarberBlockRow = {
  id: string;
  barber_id: string;
  starts_at: string;
  ends_at: string;
  reason?: string | null;
};

type MercadoPagoWebhookEventRow = {
  payment_id: string;
  processed_at?: string | null;
};

function formatStartsAtLabel(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

function buildBookingFromRow(row: BookingRow) {
  const barber = BARBERS.find((item) => item.id === row.barber_id);
  const service = SERVICES.find((item) => item.id === row.service_id);

  return {
    id: row.id,
    barberId: row.barber_id,
    barberName: barber?.name ?? "Barbero",
    serviceId: row.service_id,
    serviceName: service?.name ?? "Servicio",
    clerkUserId: row.clerk_user_id,
    startsAt: row.starts_at,
    startsAtLabel: formatStartsAtLabel(row.starts_at),
    paymentChoice: row.payment_choice,
    amountDue: Number(row.amount_due ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    notes: row.notes ?? "",
    externalReference: row.external_reference ?? row.id,
    mercadoPagoPreferenceId: row.mercado_pago_preference_id ?? null,
    mercadoPagoPaymentId: row.mercado_pago_payment_id ?? null,
    paymentStatus: row.payment_status,
    bookingStatus: row.booking_status,
  } satisfies BookingRecord;
}

function buildProfileFromRow(row: ProfileRow): UserProfile {
  return {
    clerkUserId: row.clerk_user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    barberId: row.barber_id ?? null,
  };
}

function buildBarberBlockFromRow(row: BarberBlockRow): BarberBlock {
  return {
    id: row.id,
    barberId: row.barber_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason ?? "",
  };
}

function getWeekday(date: Date): Weekday {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Buenos_Aires",
  })
    .format(date)
    .toLowerCase();

  return weekday as Weekday;
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

async function getBarberBlocksForDate(barberId: string, date: string) {
  const supabase = getSupabaseAdmin();
  const dayStart = combineDateAndTime(date, "00:00").toISOString();
  const dayEnd = combineDateAndTime(date, "23:59").toISOString();

  if (!supabase) {
    return [] as BarberBlock[];
  }

  const { data, error } = await supabase
    .from("barber_blocks")
    .select("id, barber_id, starts_at, ends_at, reason")
    .eq("barber_id", barberId)
    .lt("starts_at", dayEnd)
    .gt("ends_at", dayStart);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => buildBarberBlockFromRow(row as BarberBlockRow));
}

async function getBookingsForBarberOnDate(barberId: string, date: string) {
  const supabase = getSupabaseAdmin();
  const dayStart = combineDateAndTime(date, "00:00").toISOString();
  const dayEnd = combineDateAndTime(date, "23:59").toISOString();

  if (!supabase) {
    return MOCK_BOOKINGS.filter(
      (booking) =>
        booking.barberId === barberId &&
        booking.startsAt >= dayStart &&
        booking.startsAt <= dayEnd &&
        booking.bookingStatus !== "cancelled",
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, barber_id, service_id, clerk_user_id, starts_at, payment_choice, amount_due, amount_paid, notes, external_reference, mercado_pago_preference_id, mercado_pago_payment_id, payment_status, booking_status",
    )
    .eq("barber_id", barberId)
    .lt("starts_at", dayEnd)
    .gt("starts_at", dayStart)
    .neq("booking_status", "cancelled");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((booking) => buildBookingFromRow(booking as BookingRow));
}

export async function getAvailableTimeSlots(input: {
  barberId: string;
  serviceId: string;
  date: string;
}) {
  const barber = BARBERS.find((item) => item.id === input.barberId);
  const service = SERVICES.find((item) => item.id === input.serviceId);

  if (!barber || !service) {
    return [];
  }

  const selectedDate = combineDateAndTime(input.date, "12:00");
  const weekday = getWeekday(selectedDate);
  const shift = barber.weeklySchedule[weekday];

  if (!shift) {
    return [];
  }

  const shiftStart = combineDateAndTime(input.date, shift.start);
  const shiftEnd = combineDateAndTime(input.date, shift.end);
  const bookings = await getBookingsForBarberOnDate(input.barberId, input.date);
  const blocks = await getBarberBlocksForDate(input.barberId, input.date);
  const now = new Date();
  const slots: string[] = [];
  const serviceDurationMs = service.durationMinutes * 60_000;

  for (
    let cursor = shiftStart.getTime();
    cursor + serviceDurationMs <= shiftEnd.getTime();
    cursor += 30 * 60_000
  ) {
    const candidateStart = new Date(cursor);
    const candidateEnd = new Date(cursor + serviceDurationMs);

    if (candidateStart <= now) {
      continue;
    }

    const hasBookingConflict = bookings.some((booking) => {
      const bookingService =
        SERVICES.find((item) => item.id === booking.serviceId)?.durationMinutes ?? 60;
      const bookingStart = new Date(booking.startsAt);
      const bookingEnd = new Date(bookingStart.getTime() + bookingService * 60_000);

      return overlaps(candidateStart, candidateEnd, bookingStart, bookingEnd);
    });

    if (hasBookingConflict) {
      continue;
    }

    const hasBlockConflict = blocks.some((block) =>
      overlaps(candidateStart, candidateEnd, new Date(block.startsAt), new Date(block.endsAt)),
    );

    if (hasBlockConflict) {
      continue;
    }

    slots.push(
      candidateStart.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Buenos_Aires",
      }),
    );
  }

  return slots;
}

async function getClerkUserBasics(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${userId}@barberflow.local`;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    email.split("@")[0] ||
    "Cliente";

  return { email, displayName };
}

function getMockProfile(userId: string): UserProfile {
  return {
    clerkUserId: userId,
    email: `${userId}@demo.barberflow`,
    displayName: "Cliente demo",
    role: "client",
    barberId: null,
  };
}

async function getProfileFromDb(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, email, display_name, role, barber_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? buildProfileFromRow(data as ProfileRow) : null;
}

export async function ensureUserProfile(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getMockProfile(userId);
  }

  const existingProfile = await getProfileFromDb(userId);
  const clerkBasics = await getClerkUserBasics(userId);

  const payload = {
    clerk_user_id: userId,
    email: clerkBasics.email,
    display_name: clerkBasics.displayName,
    role: existingProfile?.role ?? ("client" as UserRole),
    barber_id: existingProfile?.barberId ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select("clerk_user_id, email, display_name, role, barber_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return buildProfileFromRow(data as ProfileRow);
}

export async function createPendingBooking(
  userId: string,
  payload: BookingRequestPayload,
) {
  const barber = BARBERS.find((item) => item.id === payload.barberId);
  const service = SERVICES.find((item) => item.id === payload.serviceId);

  if (!barber || !service) {
    throw new Error("Barbero o servicio inválido.");
  }

  const startsAt = new Date(`${payload.date}T${payload.time}:00`).toISOString();
  const amountDue =
    payload.paymentChoice === "deposit" ? service.depositAmount : service.price;
  const bookingId = crypto.randomUUID();
  const externalReference = bookingId;

  const booking: BookingRecord = {
    id: bookingId,
    barberId: barber.id,
    barberName: barber.name,
    serviceId: service.id,
    serviceName: service.name,
    clerkUserId: userId,
    startsAt,
    startsAtLabel: formatStartsAtLabel(startsAt),
    paymentChoice: payload.paymentChoice,
    amountDue,
    amountPaid: 0,
    notes: payload.notes?.trim() ?? "",
    externalReference,
    mercadoPagoPreferenceId: null,
    mercadoPagoPaymentId: null,
    paymentStatus: "pending",
    bookingStatus: "pending_payment",
  };

  const supabase = getSupabaseAdmin();

  const allowedSlots = await getAvailableTimeSlots({
    barberId: payload.barberId,
    serviceId: payload.serviceId,
    date: payload.date,
  });

  if (!allowedSlots.includes(payload.time)) {
    throw new Error("Ese horario ya no está disponible. Elegí otro turno.");
  }

  if (!supabase) {
    return booking;
  }

  const { error } = await supabase.from("bookings").insert({
    id: booking.id,
    barber_id: booking.barberId,
    service_id: booking.serviceId,
    clerk_user_id: booking.clerkUserId,
    starts_at: booking.startsAt,
    payment_choice: booking.paymentChoice,
    amount_due: booking.amountDue,
    amount_paid: booking.amountPaid,
    payment_status: booking.paymentStatus,
    booking_status: booking.bookingStatus,
    notes: booking.notes,
    external_reference: booking.externalReference,
  });

  if (error) {
    throw new Error(error.message);
  }

  return booking;
}

export async function attachMercadoPagoPreference(
  bookingId: string,
  preferenceId: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({ mercado_pago_preference_id: preferenceId })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markBookingFromMercadoPagoPayment(input: {
  externalReference: string;
  paymentId: string;
  amountPaid: number;
  paymentStatus: PaymentStatus;
}) {
  const bookingStatus: BookingStatus =
    input.paymentStatus === "approved" ? "confirmed" : "pending_payment";

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      mercado_pago_payment_id: input.paymentId,
      amount_paid: input.paymentStatus === "approved" ? input.amountPaid : 0,
      payment_status: input.paymentStatus,
      booking_status: bookingStatus,
    })
    .eq("external_reference", input.externalReference)
    .neq("booking_status", "cancelled");

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("mercadopago_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("payment_id", input.paymentId);
}

export async function registerMercadoPagoWebhookEvent(input: {
  paymentId: string;
  externalReference: string;
  paymentStatus: PaymentStatus;
  payload: unknown;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { alreadyProcessed: false };
  }

  const { data: existing, error: existingError } = await supabase
    .from("mercadopago_webhook_events")
    .select("payment_id, processed_at")
    .eq("payment_id", input.paymentId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if ((existing as MercadoPagoWebhookEventRow | null)?.processed_at) {
    return { alreadyProcessed: true };
  }

  const { error } = await supabase.from("mercadopago_webhook_events").upsert(
    {
      payment_id: input.paymentId,
      external_reference: input.externalReference,
      payment_status: input.paymentStatus,
      payload: input.payload,
    },
    { onConflict: "payment_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { alreadyProcessed: false };
}

export async function getSignedInUserEmail(userId: string) {
  try {
    const basics = await getClerkUserBasics(userId);
    return basics.email;
  } catch {
    return undefined;
  }
}

export async function getProfileByUserId(userId: string) {
  return ensureUserProfile(userId);
}

export async function sendPendingBookingEmail(booking: BookingRecord) {
  const profile = await getProfileByUserId(booking.clerkUserId);

  await sendBookingPendingEmail({
    to: profile.email,
    customerName: profile.displayName,
    barberName: booking.barberName,
    serviceName: booking.serviceName,
    startsAtLabel: booking.startsAtLabel,
    amount: booking.amountDue,
    paymentLabel: booking.paymentChoice === "deposit" ? "Seña" : "Pago total",
  });
}

export async function sendApprovedBookingEmail(externalReference: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, barber_id, service_id, clerk_user_id, starts_at, payment_choice, amount_due, amount_paid, notes, external_reference, mercado_pago_preference_id, mercado_pago_payment_id, payment_status, booking_status",
    )
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error || !data) {
    return;
  }

  const booking = buildBookingFromRow(data as BookingRow);
  const profile = await getProfileByUserId(booking.clerkUserId);

  await sendPaymentApprovedEmail({
    to: profile.email,
    customerName: profile.displayName,
    barberName: booking.barberName,
    serviceName: booking.serviceName,
    startsAtLabel: booking.startsAtLabel,
    amount: booking.amountPaid,
    paymentLabel: booking.paymentChoice === "deposit" ? "Seña" : "Pago total",
  });
}

export async function getBookingById(bookingId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return MOCK_BOOKINGS.find((booking) => booking.id === bookingId) ?? null;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, barber_id, service_id, clerk_user_id, starts_at, payment_choice, amount_due, amount_paid, notes, external_reference, mercado_pago_preference_id, mercado_pago_payment_id, payment_status, booking_status",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? buildBookingFromRow(data as BookingRow) : null;
}

export async function ensureAdmin(userId: string) {
  const profile = await ensureUserProfile(userId);

  if (profile.role !== "admin") {
    throw new Error("No autorizado.");
  }

  return profile;
}

export async function ensureStaff(userId: string) {
  const profile = await ensureUserProfile(userId);

  if (!["admin", "barber"].includes(profile.role)) {
    throw new Error("No autorizado.");
  }

  return profile;
}

export async function ensureBookingAccess(userId: string, bookingId: string) {
  const profile = await ensureUserProfile(userId);
  const booking = await getBookingById(bookingId);

  if (!booking) {
    throw new Error("Reserva no encontrada.");
  }

  const canAccess =
    profile.role === "admin" || booking.clerkUserId === userId;

  if (!canAccess) {
    throw new Error("No autorizado.");
  }

  return { profile, booking };
}

export async function updateBookingByAdmin(input: {
  userId: string;
  bookingId: string;
  action: "confirm" | "cancel" | "complete" | "no_show";
}) {
  const actor = await ensureStaff(input.userId);
  const booking = await getBookingById(input.bookingId);

  if (!booking) {
    throw new Error("Reserva no encontrada.");
  }

  if (actor.role === "barber" && actor.barberId !== booking.barberId) {
    throw new Error("No autorizado.");
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      ...booking,
      bookingStatus:
        input.action === "confirm"
          ? ("confirmed" as const)
          : input.action === "complete"
            ? ("completed" as const)
            : input.action === "no_show"
              ? ("no_show" as const)
              : ("cancelled" as const),
      paymentStatus:
        input.action === "confirm" ? ("approved" as const) : booking.paymentStatus,
      amountPaid:
        input.action === "confirm" ? booking.amountDue : booking.amountPaid,
    };
  }

  const payload =
    input.action === "confirm"
      ? {
          booking_status: "confirmed",
          payment_status: "approved",
          amount_paid: booking.amountDue,
        }
      : input.action === "complete"
        ? {
            booking_status: "completed",
          }
        : input.action === "no_show"
          ? {
              booking_status: "no_show",
            }
      : {
          booking_status: "cancelled",
        };

  const { error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", input.bookingId);

  if (error) {
    throw new Error(error.message);
  }

  const updated = await getBookingById(input.bookingId);

  if (!updated) {
    throw new Error("No pudimos refrescar la reserva.");
  }

  return updated;
}

export async function createRetryPaymentLink(input: {
  userId: string;
  bookingId: string;
  appUrl: string;
}) {
  const { booking } = await ensureBookingAccess(input.userId, input.bookingId);

  if (booking.bookingStatus === "cancelled") {
    throw new Error("La reserva está cancelada.");
  }

  if (booking.paymentStatus === "approved") {
    throw new Error("La reserva ya tiene un pago aprobado.");
  }

  const payerEmail = await getSignedInUserEmail(booking.clerkUserId);
  const preference = await createMercadoPagoPreference({
    title: `${booking.serviceName} con ${booking.barberName}`,
    amount: booking.amountDue,
    payerEmail,
    externalReference: booking.externalReference,
    appUrl: input.appUrl,
  });

  await attachMercadoPagoPreference(booking.id, preference.id);

  return preference.init_point;
}

async function getBookingsForRole(profile: UserProfile) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return MOCK_BOOKINGS.map((booking) => ({
      ...booking,
      clerkUserId: profile.clerkUserId,
    }));
  }

  let query = supabase
    .from("bookings")
    .select(
      "id, barber_id, service_id, clerk_user_id, starts_at, payment_choice, amount_due, amount_paid, notes, external_reference, mercado_pago_preference_id, mercado_pago_payment_id, payment_status, booking_status",
    )
    .order("starts_at", { ascending: true });

  if (profile.role === "client") {
    query = query.eq("clerk_user_id", profile.clerkUserId);
  }

  if (profile.role === "barber") {
    query = query.eq("barber_id", profile.barberId ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((booking) => buildBookingFromRow(booking as BookingRow));
}

function buildClientDashboard(profile: UserProfile, bookings: BookingRecord[]) {
  return {
    profile,
    bookings,
    totalPaid: bookings
      .filter((booking) => booking.paymentStatus === "approved")
      .reduce((total, booking) => total + booking.amountPaid, 0),
    nextBookingLabel: bookings[0]?.startsAtLabel ?? "Sin reservas",
  };
}

function buildBarberDashboard(profile: UserProfile, bookings: BookingRecord[]) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((booking) =>
    booking.startsAt.startsWith(todayKey),
  );
  const approvedBookings = bookings.filter(
    (booking) => booking.paymentStatus === "approved",
  );

  return {
    profile,
    barber: BARBERS.find((item) => item.id === profile.barberId) ?? null,
    bookings,
    todayBookings,
    stats: {
      totalToday: todayBookings.length,
      approvedToday: todayBookings.filter(
        (booking) => booking.paymentStatus === "approved",
      ).length,
      pendingPayments: bookings.filter(
        (booking) => booking.paymentStatus === "pending",
      ).length,
      revenueApproved: approvedBookings.reduce(
        (total, booking) => total + booking.amountPaid,
        0,
      ),
    },
  };
}

function buildAdminDashboard(profile: UserProfile, bookings: BookingRecord[]) {
  const approvedBookings = bookings.filter(
    (booking) => booking.paymentStatus === "approved",
  );
  const pendingBookings = bookings.filter(
    (booking) => booking.paymentStatus === "pending",
  );
  const byBarber = BARBERS.map((barber) => ({
    barber,
    totalBookings: bookings.filter((booking) => booking.barberId === barber.id).length,
    confirmedBookings: approvedBookings.filter(
      (booking) => booking.barberId === barber.id,
    ).length,
    pendingPayments: pendingBookings.filter(
      (booking) => booking.barberId === barber.id,
    ).length,
  }));

  return {
    profile,
    bookings,
    recentBookings: [...bookings].reverse().slice(0, 8),
    stats: {
      totalBookings: bookings.length,
      approvedBookings: approvedBookings.length,
      pendingPayments: pendingBookings.length,
      revenueApproved: approvedBookings.reduce(
        (total, booking) => total + booking.amountPaid,
        0,
      ),
    },
    byBarber,
  };
}

export async function getDashboardData(userId: string) {
  const profile = await ensureUserProfile(userId);
  const bookings = await getBookingsForRole(profile);

  if (profile.role === "admin") {
    return {
      view: "admin" as const,
      ...buildAdminDashboard(profile, bookings),
    };
  }

  if (profile.role === "barber") {
    return {
      view: "barber" as const,
      ...buildBarberDashboard(profile, bookings),
    };
  }

  return {
    view: "client" as const,
    ...buildClientDashboard(profile, bookings),
  };
}

export function getRoleLabel(role: UserRole) {
  if (role === "admin") return "Administrador";
  if (role === "barber") return "Barbero";
  return "Cliente";
}

export function getBookingStatusLabel(status: BookingStatus) {
  if (status === "pending_payment") return "Pendiente de pago";
  if (status === "confirmed") return "Confirmado";
  if (status === "completed") return "Realizado";
  if (status === "no_show") return "No asistió";
  return "Cancelado";
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "approved") return "Aprobado";
  if (status === "pending") return "Pendiente";
  return "Rechazado";
}

export function getBarberOptions(): Barber[] {
  return BARBERS;
}

export async function createBarberBlock(input: {
  userId: string;
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const actor = await ensureStaff(input.userId);

  if (actor.role === "barber" && actor.barberId !== input.barberId) {
    throw new Error("No autorizado.");
  }

  const startsAt = combineDateAndTime(input.date, input.startTime);
  const endsAt = combineDateAndTime(input.date, input.endTime);

  if (endsAt <= startsAt) {
    throw new Error("El bloqueo debe terminar después de empezar.");
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("barber_blocks").insert({
    barber_id: input.barberId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: input.reason.trim() || "Bloqueo manual",
  });

  if (error) {
    throw new Error(error.message);
  }
}
