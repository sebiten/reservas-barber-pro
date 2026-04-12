import { auth } from "@clerk/nextjs/server";
import { updateBookingByAdmin } from "@/lib/data";
import { adminBookingActionSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/bookings/[bookingId]">,
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  const { bookingId } = await context.params;
  let body: ReturnType<typeof adminBookingActionSchema.parse>;

  try {
    body = adminBookingActionSchema.parse(await request.json());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Acción inválida." },
      { status: 400 },
    );
  }

  try {
    const booking = await updateBookingByAdmin({
      userId,
      bookingId,
      action: body.action,
    });

    return Response.json({ booking });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pudimos actualizar la reserva.";

    return Response.json(
      { error: message },
      { status: message === "No autorizado." ? 403 : 500 },
    );
  }
}
