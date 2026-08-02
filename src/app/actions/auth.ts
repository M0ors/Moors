"use server";

import { redirect } from "next/navigation";
import { getAge } from "@/lib/age";
import { createClient } from "@/lib/supabase/server";

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();

  if (!email || !password || !username || !dateOfBirth) {
    return { error: "All fields are required." };
  }

  if (username.length < 3 || username.length > 24) {
    return { error: "Username must be 3–24 characters." };
  }

  const age = getAge(dateOfBirth);
  if (age === null) {
    return { error: "Enter a valid date of birth." };
  }

  if (age < 13) {
    return { error: "You must be at least 13 years old to sign up." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        date_of_birth: dateOfBirth,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Sign up failed." };
  }

  redirect("/");
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
