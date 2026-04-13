import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return Response.json({
      ok: true,
      mode: "demo",
      timestamp: new Date().toISOString(),
    });
  }

  const { error } = await supabase
    .from("barbers")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json(
      {
        ok: false,
        service: "supabase",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    mode: "production",
    service: "supabase",
    timestamp: new Date().toISOString(),
  });
}
