import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: { error?: string };
};

export default async function LoginPage({ searchParams }: Props) {
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
      {searchParams.error === "banned" ? (
        <p className="text-red-600 text-sm mb-4">
          Your account has been banned.
        </p>
      ) : null}
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
