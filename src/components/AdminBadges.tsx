import { updateBadgeImage } from "@/app/actions/admin";
import { BadgeIcon } from "@/components/BadgeIcon";

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_nsfw: boolean;
};

type Props = {
  badges: Badge[];
};

export function AdminBadges({ badges }: Props) {
  return (
    <section className="mb-10">
      <h2 className="font-medium mb-3">Badges</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Badge images can be added later. Paste a public image URL when ready.
      </p>
      <ul className="space-y-3">
        {badges.map((badge) => (
          <li key={badge.id} className="border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <BadgeIcon badge={badge} size={20} />
              <div>
                <p className="font-medium text-sm">
                  {badge.name}
                  {badge.is_nsfw ? (
                    <span className="ml-2 text-xs text-red-700">NSFW</span>
                  ) : null}
                </p>
                <p className="text-xs text-neutral-500">{badge.slug}</p>
              </div>
            </div>
            <form action={updateBadgeImage} className="flex flex-wrap gap-2 items-end">
              <input type="hidden" name="id" value={badge.id} />
              <label className="flex flex-col gap-1 text-sm flex-1 min-w-[200px]">
                Image URL
                <input
                  name="image_url"
                  defaultValue={badge.image_url ?? ""}
                  className="border p-2"
                  placeholder="https://..."
                />
              </label>
              <button type="submit" className="!px-3 !py-2">
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
