import { auth } from "@clerk/nextjs/server";
import { createBarberBlock } from "@/lib/data";
import { barberBlockSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: ReturnType<typeof barberBlockSchema.parse>;

  try {
    body = barberBlockSchema.parse(await request.json());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Faltan datos del bloqueo.",
      },
      { status: 400 },
    );
  }

  try {
    await createBarberBlock({
      userId,
      barberId: body.barberId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason ?? "",
    });

    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pudimos crear el bloqueo.";

    return Response.json(
      { error: message },
      { status: message === "No autorizado." ? 403 : 500 },
    );
  }
}
