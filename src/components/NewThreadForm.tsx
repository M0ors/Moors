"use client";

import { useFormState } from "react-dom";
import { createThread } from "@/app/actions/threads";
import { ImageField } from "@/components/ImageField";

export function NewThreadForm() {
  const [state, formAction] = useFormState(createThread, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <label className="flex flex-col gap-1">
        Title
        <input name="title" required maxLength={200} className="border p-2" />
      </label>
      <label className="flex flex-col gap-1">
        Body
        <textarea name="body" rows={8} className="border p-2" />
      </label>
      <ImageField />
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Create thread</button>
    </form>
  );
}
