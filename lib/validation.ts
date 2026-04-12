import { z } from "zod";

export const bookingRequestSchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  paymentChoice: z.enum(["deposit", "full"]),
  notes: z.string().max(500).optional().default(""),
});

export const adminBookingActionSchema = z.object({
  action: z.enum(["confirm", "cancel", "complete", "no_show"]),
});

export const barberBlockSchema = z
  .object({
    barberId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().max(200).optional().default(""),
  })
  .refine((input) => input.endTime > input.startTime, {
    error: "El horario de fin debe ser posterior al de inicio.",
    path: ["endTime"],
  });

export const mercadoPagoWebhookSchema = z.object({
  data: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
  type: z.string().optional(),
});
