import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_moderator, is_banned")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned || (!profile.is_admin && !profile.is_moderator)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count: images } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .not("image_url", "is", null)
    .eq("image_approved", false);

  let access = 0;
  if (profile.is_admin) {
    const { count } = await supabase
      .from("access_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    access = count ?? 0;
  }

  const imageCount = images ?? 0;
  const pending = imageCount + access;

  return NextResponse.json({
    pending,
    images: imageCount,
    access,
  });
}
