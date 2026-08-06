"use client";

import { useFormState } from "react-dom";
import {
  createBadge,
  deleteBadge,
  grantBadge,
  updateBadge,
} from "@/app/actions/admin";
import { BadgeIcon } from "@/components/BadgeIcon";

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_nsfw: boolean;
  sort_order?: number;
};

type Props = {
  badges: Badge[];
};

export function AdminBadges({ badges }: Props) {
  const [createState, createAction] = useFormState(createBadge, undefined);
  const [grantState, grantAction] = useFormState(grantBadge, undefined);

  return (
    <section>
      <h2 className="font-medium mb-2">Badges</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Create badges, set image URLs, and grant them to users by username.
        Users can display one earned badge next to their username.
      </p>

      <form
        action={grantAction}
        className="border rounded p-4 mb-6 grid gap-3 max-w-2xl"
      >
        <h3 className="text-sm font-medium">Grant badge</h3>
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            name="username"
            required
            maxLength={24}
            className="border p-2"
            placeholder="exact username"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Badge
          <select name="badge_id" required className="border p-2" defaultValue="">
            <option value="" disabled>
              Select a badge
            </option>
            {badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
        </label>
        {grantState?.error ? (
          <p className="text-red-600 text-sm">{grantState.error}</p>
        ) : null}
        <button type="submit" disabled={!badges.length}>
          Grant badge
        </button>
      </form>

      <form
        action={createAction}
        className="border rounded p-4 mb-6 grid gap-3 max-w-2xl"
      >
        <h3 className="text-sm font-medium">Create badge</h3>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required maxLength={80} className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug (optional — auto from name)
          <input
            name="slug"
            maxLength={40}
            className="border p-2"
            placeholder="first_thread"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <input name="description" maxLength={200} className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Image URL
          <input
            name="image_url"
            className="border p-2"
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sort order
          <input
            name="sort_order"
            type="number"
            defaultValue={badges.length + 1}
            className="border p-2"
          />
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" name="is_nsfw" /> Hidden from non-NSFW users
        </label>
        {createState?.error ? (
          <p className="text-red-600 text-sm">{createState.error}</p>
        ) : null}
        <button type="submit">Create badge</button>
      </form>

      {!badges.length ? (
        <p className="text-sm text-neutral-600">No badges yet.</p>
      ) : (
        <ul className="space-y-4">
          {badges.map((badge) => (
            <li key={badge.id} className="border rounded p-4 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <BadgeIcon badge={badge} size={22} />
                <p className="text-xs text-neutral-500">{badge.slug}</p>
              </div>
              <form action={updateBadge} className="grid gap-2">
                <input type="hidden" name="id" value={badge.id} />
                <label className="flex flex-col gap-1 text-sm">
                  Name
                  <input
                    name="name"
                    required
                    defaultValue={badge.name}
                    className="border p-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Description
                  <input
                    name="description"
                    defaultValue={badge.description ?? ""}
                    className="border p-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Image URL
                  <input
                    name="image_url"
                    defaultValue={badge.image_url ?? ""}
                    className="border p-2"
                    placeholder="https://..."
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Sort order
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={badge.sort_order ?? 0}
                    className="border p-2"
                  />
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_nsfw"
                    defaultChecked={badge.is_nsfw}
                  />{" "}
                  Hidden from non-NSFW users
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit">Save</button>
                </div>
              </form>
              <form action={deleteBadge} className="mt-2">
                <input type="hidden" name="id" value={badge.id} />
                <button type="submit" className="!bg-white !text-red-700">
                  Delete badge
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
