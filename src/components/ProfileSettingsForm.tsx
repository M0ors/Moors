"use client";

import { useFormState } from "react-dom";
import { updateProfileDetails } from "@/app/actions/profile";
import { BadgeIcon } from "@/components/BadgeIcon";
import type { BadgeRow } from "@/lib/badges";
import { USERNAME_COLOR_PRESETS } from "@/lib/colors";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  aboutMe?: string | null;
  usernameColor?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
  topLikes?: string[] | null;
  topDislikes?: string[] | null;
  ownedBadges?: BadgeRow[];
  displayBadgeId?: string | null;
};

export function ProfileSettingsForm({
  aboutMe,
  usernameColor,
  countryCode,
  dateOfBirth,
  topLikes = [],
  topDislikes = [],
  ownedBadges = [],
  displayBadgeId,
}: Props) {
  const [state, formAction] = useFormState(updateProfileDetails, undefined);
  const likes = topLikes ?? [];
  const dislikes = topDislikes ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl mt-8">
      <h2 className="font-medium">Profile details</h2>

      <label className="flex flex-col gap-1">
        About me
        <textarea
          name="about_me"
          rows={4}
          maxLength={500}
          defaultValue={aboutMe ?? ""}
          className="border p-2"
          placeholder="A short bio (optional)"
        />
      </label>

      <label className="flex flex-col gap-1">
        Date of birth
        <input
          name="date_of_birth"
          type="date"
          defaultValue={dateOfBirth ?? ""}
          className="border p-2"
        />
        <span className="text-sm text-neutral-600">
          Must be 13+.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-sm">Likes (optional)</legend>
        {[0, 1, 2].map((i) => (
          <input
            key={`like-${i}`}
            name={`top_like_${i + 1}`}
            maxLength={40}
            defaultValue={likes[i] ?? ""}
            className="border p-2"
            placeholder={`Like #${i + 1}`}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-sm">Dislikes (optional)</legend>
        {[0, 1, 2].map((i) => (
          <input
            key={`dislike-${i}`}
            name={`top_dislike_${i + 1}`}
            maxLength={40}
            defaultValue={dislikes[i] ?? ""}
            className="border p-2"
            placeholder={`Dislike #${i + 1}`}
          />
        ))}
      </fieldset>

      <label className="flex flex-col gap-1">
        Display badge
        <select
          name="display_badge_id"
          defaultValue={displayBadgeId ?? ""}
          className="border p-2"
        >
          <option value="">No badge</option>
          {ownedBadges.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-neutral-600">
          One badge shows next to your username. You can earn more over time.
        </span>
      </label>

      {ownedBadges.length ? (
        <div className="flex flex-wrap gap-2">
          {ownedBadges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1 text-xs border px-2 py-1"
            >
              <BadgeIcon badge={badge} size={14} />
              {badge.name}
            </span>
          ))}
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        Country flag (optional)
        <select
          name="country_code"
          defaultValue={countryCode ?? ""}
          className="border p-2"
        >
          <option value="">No flag</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Username color (optional)
        <input
          name="username_color"
          type="text"
          placeholder="#2563eb"
          defaultValue={usernameColor ?? ""}
          pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
          className="border p-2"
          list="username-color-presets"
        />
        <datalist id="username-color-presets">
          {USERNAME_COLOR_PRESETS.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
        <span className="text-sm text-neutral-600">
          Hex color like #2563eb. Leave blank for default. Admins always show
          white with a red glow.
        </span>
      </label>

      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">Save profile</button>
    </form>
  );
}
