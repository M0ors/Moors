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
          <input name="username" required minLength={3} maxLength={24} className="border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Email
          <input name="email" type="email" required className="border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input name="password" type="password" required minLength={6} className="border p-2" />
        </label>
      </AuthForm>
      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
