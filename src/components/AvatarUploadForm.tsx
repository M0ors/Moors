"use client";

import { useFormState } from "react-dom";
import { updateAvatar } from "@/app/actions/profile";

export function AvatarUploadForm() {
  const [state, formAction] = useFormState(updateAvatar, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-sm">
      <label className="flex flex-col gap-1">
        Profile picture
        <input
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="border p-2"
        />
      </label>
      <p className="text-sm text-neutral-600">JPG, PNG, WebP, or GIF. Max 1MB.</p>
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Upload picture</button>
    </form>
  );
}
