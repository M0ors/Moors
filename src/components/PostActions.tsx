"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { deletePost, updatePost } from "@/app/actions/threads";

type Props = {
  postId: string;
  threadId: string;
  body: string;
  canEdit: boolean;
  canDelete: boolean;
};

export function PostActions({
  postId,
  threadId,
  body,
  canEdit,
  canDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useFormState(updatePost, undefined);

  if (!canEdit && !canDelete) {
    return null;
  }

  if (editing && canEdit) {
    return (
      <form action={formAction} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="thread_id" value={threadId} />
        <textarea
          name="body"
          required
          rows={5}
          defaultValue={body}
          className="border p-2"
        />
        {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
        <div className="flex gap-2">
          <button type="submit">Save</button>
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
    <div className="flex gap-2 text-sm">
      {canEdit ? (
        <button
          type="button"
          className="!bg-white !text-neutral-900 !px-2 !py-1"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
      ) : null}
      {canDelete ? (
        <form action={deletePost}>
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="thread_id" value={threadId} />
          <button
            type="submit"
            className="!bg-white !text-red-700 !px-2 !py-1"
          >
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}
