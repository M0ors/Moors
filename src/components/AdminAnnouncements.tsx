"use client";

import { useFormState } from "react-dom";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/app/actions/admin";

type Announcement = {
  id: string;
  title: string;
  body: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
};

type Props = {
  announcements: Announcement[];
};

export function AdminAnnouncements({ announcements }: Props) {
  const [createState, createAction] = useFormState(createAnnouncement, undefined);

  return (
    <section>
      <h2 className="font-medium mb-2">Announcements</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Publish site-wide announcements (title + text). They appear in the
        sidebar for everyone. Likes/dislikes are allowed; replies are not. Site
        updates threads also show in that list.
      </p>

      <form
        action={createAction}
        className="border rounded p-4 mb-6 grid gap-3 max-w-2xl"
      >
        <h3 className="text-sm font-medium">New announcement</h3>
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input name="title" required maxLength={200} className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Text
          <textarea
            name="body"
            required
            rows={6}
            maxLength={10000}
            className="border p-2"
          />
        </label>
        {createState?.error ? (
          <p className="text-red-600 text-sm">{createState.error}</p>
        ) : null}
        <button type="submit">Publish</button>
      </form>

      {!announcements.length ? (
        <p className="text-sm text-neutral-600">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((item) => (
            <li key={item.id} className="border rounded p-4 max-w-2xl">
              <p className="text-xs text-neutral-500 mb-2">
                {new Date(item.created_at).toLocaleString()} · {item.like_count}{" "}
                likes · {item.dislike_count} dislikes
              </p>
              <form action={updateAnnouncement} className="grid gap-2">
                <input type="hidden" name="id" value={item.id} />
                <label className="flex flex-col gap-1 text-sm">
                  Title
                  <input
                    name="title"
                    required
                    maxLength={200}
                    defaultValue={item.title}
                    className="border p-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Text
                  <textarea
                    name="body"
                    required
                    rows={5}
                    maxLength={10000}
                    defaultValue={item.body}
                    className="border p-2"
                  />
                </label>
                <button type="submit">Save</button>
              </form>
              <form action={deleteAnnouncement} className="mt-2">
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="!bg-white !text-red-700">
                  Delete announcement
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
