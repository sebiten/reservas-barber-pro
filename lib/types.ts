export type PaymentChoice = "deposit" | "full";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled";
export type UserRole = "client" | "barber" | "admin";
export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Barber = {
  id: string;
  name: string;
  specialty: string;
  shiftLabel: string;
  bio: string;
  weeklySchedule: Partial<Record<Weekday, { start: string; end: string }>>;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  depositAmount: number;
};

export type BookingRequestPayload = {
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  paymentChoice: PaymentChoice;
  notes?: string;
};

export type BookingRecord = {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clerkUserId: string;
  startsAt: string;
  startsAtLabel: string;
  paymentChoice: PaymentChoice;
  amountDue: number;
  amountPaid: number;
  notes: string;
  externalReference: string;
  mercadoPagoPreferenceId?: string | null;
  mercadoPagoPaymentId?: string | null;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
};

export type UserProfile = {
  clerkUserId: string;
  email: string;
  displayName: string;
  role: UserRole;
  barberId?: string | null;
};

export type BarberBlock = {
  id: string;
  barberId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
};
