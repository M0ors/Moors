"use client";

import { useFormState } from "react-dom";
import { createThread } from "@/app/actions/threads";
import { ImageField } from "@/components/ImageField";

type Props = {
  boardSlug: string;
  boardName: string;
  isAdult: boolean;
};

export function NewThreadForm({ boardSlug, boardName, isAdult }: Props) {
  const [state, formAction] = useFormState(createThread, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="board" value={boardSlug} />
      <p className="text-sm text-neutral-600">
        Posting in <strong>{boardName}</strong>
        {isAdult ? " (Adult)" : ""}.
      </p>
      <label className="flex flex-col gap-1">
        Title
        <input name="title" required maxLength={200} className="border p-2" />
      </label>
      <label className="flex flex-col gap-1">
        Body
        <textarea name="body" rows={8} className="border p-2" />
      </label>
      <ImageField />
      <p className="text-sm text-neutral-600">
        Images stay private until an admin approves them.
      </p>
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Create thread</button>
    </form>
  );
}
