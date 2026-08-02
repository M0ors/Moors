"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { deleteThread, toggleThreadNsfw, updateThread } from "@/app/actions/threads";

type Props = {
  threadId: string;
  title: string;
  isNsfw: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canToggleNsfw: boolean;
};

export function ThreadActions({
  threadId,
  title,
  isNsfw,
  canEdit,
  canDelete,
  canToggleNsfw,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useFormState(updateThread, undefined);

  if (!canEdit && !canDelete && !canToggleNsfw) {
    return null;
  }

  if (editing && canEdit) {
    return (
      <form action={formAction} className="mt-3 flex flex-col gap-2 max-w-xl">
        <input type="hidden" name="thread_id" value={threadId} />
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={title}
          className="border p-2"
        />
        {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
        <div className="flex gap-2">
          <button type="submit">Save title</button>
          <button
            type="button"
            className="!bg-white !text-neutral-900"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {canEdit ? (
        <button
          type="button"
          className="!bg-white !text-neutral-900 !px-2 !py-1"
          onClick={() => setEditing(true)}
        >
          Edit title
        </button>
      ) : null}
      {canToggleNsfw ? (
        <form action={toggleThreadNsfw}>
          <input type="hidden" name="thread_id" value={threadId} />
          <input type="hidden" name="is_nsfw" value={isNsfw ? "false" : "true"} />
          <button type="submit" className="!bg-white !text-neutral-900 !px-2 !py-1">
            {isNsfw ? "Unmark NSFW" : "Mark NSFW"}
          </button>
        </form>
      ) : null}
      {canDelete ? (
        <form action={deleteThread}>
          <input type="hidden" name="thread_id" value={threadId} />
          <button type="submit" className="!bg-white !text-red-700 !px-2 !py-1">
            Delete thread
          </button>
        </form>
      ) : null}
    </div>
  );
}
