"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { createThread } from "@/app/actions/threads";
import { ImageField } from "@/components/ImageField";

type SubBoardOption = {
  slug: string;
  name: string;
  is_adult: boolean;
  allow_anonymous: boolean;
  max_threads_per_user: number | null;
  op_only_replies: boolean;
};

type Props = {
  boardSlug: string;
  boardName: string;
  isAdult: boolean;
  subBoards: SubBoardOption[];
  initialSubBoard?: string;
};

export function NewThreadForm({
  boardSlug,
  boardName,
  isAdult,
  subBoards,
  initialSubBoard,
}: Props) {
  const [state, formAction] = useFormState(createThread, undefined);
  const [subSlug, setSubSlug] = useState(
    initialSubBoard && subBoards.some((s) => s.slug === initialSubBoard)
      ? initialSubBoard
      : subBoards[0]?.slug ?? ""
  );

  const selected = useMemo(
    () => subBoards.find((s) => s.slug === subSlug) ?? null,
    [subBoards, subSlug]
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="board" value={boardSlug} />
      <p className="text-sm text-neutral-600">
        Posting in <strong>{boardName}</strong>
        {isAdult ? " (Adult)" : ""}.
      </p>

      <label className="flex flex-col gap-1">
        Sub-board
        <select
          name="sub_board"
          required
          value={subSlug}
          onChange={(e) => setSubSlug(e.target.value)}
          className="border p-2"
        >
          {subBoards.map((sub) => (
            <option key={sub.slug} value={sub.slug}>
              {sub.name}
              {sub.is_adult ? " (Adult)" : ""}
            </option>
          ))}
        </select>
      </label>

      {selected?.max_threads_per_user === 1 ? (
        <p className="text-sm text-neutral-600">
          Blogs allow one thread per user. Only you can reply to it.
        </p>
      ) : null}

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

      {selected?.allow_anonymous ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="anonymous" className="mt-1" />
          <span>Post as anonymous (username hidden to other users)</span>
        </label>
      ) : null}

      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Create thread</button>
    </form>
  );
}
