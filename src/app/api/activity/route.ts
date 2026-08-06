import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MIN_INTERVAL_MS = 45_000;

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, last_active_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.last_active_at) {
    const last = new Date(profile.last_active_at).getTime();
    if (!Number.isNaN(last) && Date.now() - last < MIN_INTERVAL_MS) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
