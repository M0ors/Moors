import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <AuthForm action={signIn} submitLabel="Log in">
        <label className="flex flex-col gap-1">
          Email
          <input name="email" type="email" required className="border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input name="password" type="password" required className="border p-2" />
        </label>
      </AuthForm>
      <p className="mt-4 text-sm">
        No account? <Link href="/signup">Sign up</Link>
      </p>
    </main>
  );
}
