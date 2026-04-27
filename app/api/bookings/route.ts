import { auth } from "@clerk/nextjs/server";
import {
  attachMercadoPagoPreference,
  createPendingBooking,
  getSignedInUserEmail,
  sendPendingBookingEmail,
} from "@/lib/data";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import { bookingRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "Necesitás iniciar sesión para reservar." },
      { status: 401 },
    );
  }

  let payload: ReturnType<typeof bookingRequestSchema.parse>;

  try {
    payload = bookingRequestSchema.parse(await request.json());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Completá barbero, servicio, fecha, horario y tipo de pago.",
      },
      { status: 400 },
    );
  }

  try {
    const booking = await createPendingBooking(userId, payload);
    const payerEmail = await getSignedInUserEmail(userId);
    const preference = await createMercadoPagoPreference({
      title: `${booking.serviceName} con ${booking.barberName}`,
      amount: booking.amountDue,
      payerEmail,
      externalReference: booking.externalReference,
    });

    await attachMercadoPagoPreference(booking.id, preference.id);
    await sendPendingBookingEmail(booking).catch(() => {});

    return Response.json({
      message: `Reserva creada. Te redirigimos a Mercado Pago para pagar ${booking.paymentChoice === "deposit" ? "la seña" : "el total"} por $${booking.amountDue.toLocaleString("es-AR")}.`,
      booking,
      initPoint: preference.init_point,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos crear la reserva.",
      },
      { status: 500 },
    );
  }
}
