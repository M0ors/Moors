import { redirect } from "next/navigation";
import { NewThreadForm } from "@/components/NewThreadForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewThreadPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">New thread</h1>
      <NewThreadForm />
    </main>
  );
}
