import { auth } from "@clerk/nextjs/server";
import { createRetryPaymentLink } from "@/lib/data";

export async function POST(
  request: Request,
  context: RouteContext<"/api/bookings/[bookingId]/retry-payment">,
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  try {
    const initPoint = await createRetryPaymentLink({
      userId,
      bookingId,
      appUrl: new URL(request.url).origin,
    });

    return Response.json({ initPoint });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos generar el link de pago.";

    return Response.json(
      { error: message },
      { status: message === "No autorizado." ? 403 : 500 },
    );
  }
}
