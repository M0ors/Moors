"use client";

import { useFormState } from "react-dom";
import { createReply } from "@/app/actions/threads";

type Props = {
  threadId: string;
};

export function ReplyForm({ threadId }: Props) {
  const [state, formAction] = useFormState(createReply, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl mt-8">
      <input type="hidden" name="thread_id" value={threadId} />
      <label className="flex flex-col gap-1">
        Reply
        <textarea name="body" required rows={5} className="border p-2" />
      </label>
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Post reply</button>
    </form>
  );
}
