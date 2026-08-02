import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
};

export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, is_admin, is_banned")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: (profile as CurrentProfile | null) ?? null,
  };
}

export async function requireAdmin() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile?.is_admin) {
    redirect("/");
  }

  if (profile.is_banned) {
    redirect("/login?error=banned");
  }

  return { user, profile };
}
