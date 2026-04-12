import { getAvailableTimeSlots } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!barberId || !serviceId || !date) {
    return Response.json({ slots: [] });
  }

  try {
    const slots = await getAvailableTimeSlots({ barberId, serviceId, date });
    return Response.json({ slots });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos calcular la disponibilidad.",
      },
      { status: 500 },
    );
  }
}
