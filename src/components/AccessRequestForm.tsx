"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { submitAccessRequest } from "@/app/actions/access";

type Props = {
  pending?: boolean;
  hasNsfwAccess?: boolean;
};

export function AccessRequestForm({
  pending = false,
  hasNsfwAccess = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(submitAccessRequest, undefined);

  if (hasNsfwAccess) {
    return (
      <section className="mt-10 max-w-xl">
        <h2 className="font-medium mb-2">Request access</h2>
        <p className="text-sm text-neutral-600">
          You already have Adult board access.
        </p>
      </section>
    );
  }

  if (pending) {
    return (
      <section className="mt-10 max-w-xl">
        <h2 className="font-medium mb-2">Request access</h2>
        <p className="text-sm text-neutral-600">
          Your access request is pending admin review.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 max-w-xl">
      <h2 className="font-medium mb-2">Request access</h2>
      <p className="text-sm text-neutral-600 mb-3">
        Additional board access is granted by an admin after you submit this
        request.
      </p>
      {!open ? (
        <button
          type="button"
          className="!bg-white !text-neutral-900"
          onClick={() => setOpen(true)}
        >
          Request access
        </button>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            Name
            <input name="full_name" required maxLength={120} className="border p-2" />
          </label>
          <label className="flex flex-col gap-1">
            Age
            <input
              name="age"
              type="number"
              required
              min={18}
              max={120}
              className="border p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Access wanted
            <textarea
              name="access_wanted"
              required
              rows={4}
              maxLength={1000}
              className="border p-2"
              placeholder="Additional board access"
            />
          </label>
          {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
          <div className="flex gap-2">
            <button type="submit">Submit request</button>
            <button
              type="button"
              className="!bg-white !text-neutral-900"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
