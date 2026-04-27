import type { Barber, BookingRecord, Service } from "@/lib/types";

export const BARBERS: Barber[] = [
  {
    id: "barber-lucho",
    name: "Lucho Vargas",
    specialty: "Fade preciso + barba clásica",
    shiftLabel: "Lun a Vie 10:00 - 19:00",
    bio: "Especialista en degradados limpios y terminaciones prolijas para clientes de rutina semanal.",
    weeklySchedule: {
      monday: { start: "10:00", end: "19:00" },
      tuesday: { start: "10:00", end: "19:00" },
      wednesday: { start: "10:00", end: "19:00" },
      thursday: { start: "10:00", end: "19:00" },
      friday: { start: "10:00", end: "19:00" },
    },
  },
  {
    id: "barber-nico",
    name: "Nico Roldán",
    specialty: "Cortes largos + textura",
    shiftLabel: "Mar a Sáb 11:00 - 20:00",
    bio: "Ideal para estilos modernos, volumen, textura y asesoramiento integral de look.",
    weeklySchedule: {
      tuesday: { start: "11:00", end: "20:00" },
      wednesday: { start: "11:00", end: "20:00" },
      thursday: { start: "11:00", end: "20:00" },
      friday: { start: "11:00", end: "20:00" },
      saturday: { start: "11:00", end: "20:00" },
    },
  },
  {
    id: "barber-santi",
    name: "Santi Quiroga",
    specialty: "Perfilado premium + ritual",
    shiftLabel: "Mié a Dom 12:00 - 21:00",
    bio: "Enfocado en experiencia premium con toalla caliente, perfilado y cuidado de barba.",
    weeklySchedule: {
      wednesday: { start: "12:00", end: "21:00" },
      thursday: { start: "12:00", end: "21:00" },
      friday: { start: "12:00", end: "21:00" },
      saturday: { start: "12:00", end: "21:00" },
      sunday: { start: "12:00", end: "21:00" },
    },
  },
];

export const SERVICES: Service[] = [
  {
    id: "service-fade",
    name: "Fade + styling",
    description: "Corte con degradé, lavado rápido y acabado con producto.",
    durationMinutes: 45,
    price: 300,
    depositAmount: 300,
  },
  {
    id: "service-beard",
    name: "Barba premium",
    description: "Perfilado, toalla caliente y tratamiento hidratante.",
    durationMinutes: 30,
    price: 300,
    depositAmount: 300,
  },
  {
    id: "service-full",
    name: "Corte + barba",
    description: "Servicio completo con asesoría de estilo y acabado premium.",
    durationMinutes: 60,
    price: 300,
    depositAmount: 300,
  },
];

export const MOCK_BOOKINGS: BookingRecord[] = [
  {
    id: "booking-demo-1",
    barberId: "barber-lucho",
    barberName: "Lucho Vargas",
    serviceId: "service-full",
    serviceName: "Corte + barba",
    clerkUserId: "demo-user",
    startsAt: "2026-04-12T16:00:00.000Z",
    startsAtLabel: "12 abr, 13:00",
    paymentChoice: "deposit",
    amountDue: 300,
    amountPaid: 300,
    notes: "Prefiere laterales bien bajos.",
    externalReference: "booking-demo-1",
    mercadoPagoPreferenceId: "demo-preference",
    mercadoPagoPaymentId: "demo-payment",
    paymentStatus: "approved",
    bookingStatus: "confirmed",
  },
];
