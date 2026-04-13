import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return Response.json(
      {
        ok: false,
        error: "Supabase no estA configurado.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  const { error, count } = await supabase
    .from("barbers")
    .select("id", { count: "exact", head: true });

  return Response.json({
    ok: !error,
    count: count ?? 0,
    error: error?.message ?? null,
    timestamp: new Date().toISOString(),
  });
}
