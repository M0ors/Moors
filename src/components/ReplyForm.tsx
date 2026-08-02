"use client";

import { useFormState } from "react-dom";
import { createReply } from "@/app/actions/threads";
import { ImageField } from "@/components/ImageField";

type Props = {
  threadId: string;
  parentId?: string | null;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function ReplyForm({ threadId, parentId = null, onCancel, autoFocus }: Props) {
  const [state, formAction] = useFormState(createReply, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-xl">
      <input type="hidden" name="thread_id" value={threadId} />
      {parentId ? <input type="hidden" name="parent_id" value={parentId} /> : null}
      <label className="flex flex-col gap-1">
        {parentId ? "Reply to comment" : "Reply"}
        <textarea
          name="body"
          rows={4}
          className="border p-2"
          autoFocus={autoFocus}
        />
      </label>
      <ImageField />
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <div className="flex gap-2">
        <button type="submit">Post reply</button>
        {onCancel ? (
          <button
            type="button"
            className="!bg-white !text-neutral-900"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
