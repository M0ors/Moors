import Link from "next/link";
import { redirect } from "next/navigation";
import { removeAvatar } from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";
import { AvatarUploadForm } from "@/components/AvatarUploadForm";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-6">Your profile</h1>

      <div className="flex items-center gap-4 mb-8">
        <Avatar
          username={profile?.username}
          avatarUrl={profile?.avatar_url}
          size={72}
        />
        <div>
          <p className="font-medium">{profile?.username ?? "unknown"}</p>
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
    </main>
  );
}
