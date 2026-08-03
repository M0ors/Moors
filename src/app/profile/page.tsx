import Link from "next/link";
import { redirect } from "next/navigation";
import { removeAvatar } from "@/app/actions/profile";
import { AccessRequestForm } from "@/components/AccessRequestForm";
import { Avatar } from "@/components/Avatar";
import { AvatarUploadForm } from "@/components/AvatarUploadForm";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { Username } from "@/components/Username";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: { request?: string };
};

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, avatar_url, is_admin, about_me, username_color, country_code, date_of_birth, nsfw_enabled"
    )
    .eq("id", user.id)
    .single();

  const { data: pendingRequest } = await supabase
    .from("access_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Boards</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-6">Your profile</h1>

      {searchParams.request === "sent" ? (
        <p className="mb-4 text-sm text-green-700">Access request sent.</p>
      ) : null}

      <div className="flex items-center gap-4 mb-8">
        <Avatar
          username={profile?.username}
          avatarUrl={profile?.avatar_url}
          size={72}
        />
        <div>
          <p className="font-medium">
            <Username
              username={profile?.username}
              isAdmin={profile?.is_admin}
              color={profile?.username_color}
              countryCode={profile?.country_code}
              href={profile?.username ? `/u/${profile.username}` : null}
            />
          </p>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </div>
      </div>

      <AvatarUploadForm />

      {profile?.avatar_url ? (
        <form action={removeAvatar} className="mt-4">
          <button type="submit" className="!bg-white !text-neutral-900">
            Remove picture
          </button>
        </form>
      ) : null}

      <ProfileSettingsForm
        aboutMe={profile?.about_me}
        usernameColor={profile?.username_color}
        countryCode={profile?.country_code}
        dateOfBirth={profile?.date_of_birth}
        nsfwEnabled={profile?.nsfw_enabled}
      />

      <AccessRequestForm pending={Boolean(pendingRequest)} />
    </main>
  );
}
