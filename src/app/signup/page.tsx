import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export default async function SignUpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">Sign up</h1>
      <AuthForm action={signUp} submitLabel="Create account">
        <label className="flex flex-col gap-1">
          Username
          <input
            name="username"
            required
            minLength={3}
            maxLength={24}
            pattern="^[A-Za-z0-9._]{3,24}$"
            title="Letters, numbers, dots, and underscores only"
            className="border p-2"
          />
          <span className="text-sm text-neutral-600">
            Letters, numbers, dots, and underscores only — no spaces.
          </span>
        </label>
        <label className="flex flex-col gap-1">
          Email
          <input name="email" type="email" required className="border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Date of birth
          <input name="date_of_birth" type="date" required className="border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input name="password" type="password" required minLength={6} className="border p-2" />
        </label>
        <p className="text-sm text-neutral-600">
          You must be at least 13.
        </p>
      </AuthForm>
      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
