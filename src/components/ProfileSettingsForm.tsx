"use client";

import { useFormState } from "react-dom";
import { updateProfileDetails } from "@/app/actions/profile";
import { USERNAME_COLOR_PRESETS } from "@/lib/colors";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  aboutMe?: string | null;
  usernameColor?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
};

export function ProfileSettingsForm({
  aboutMe,
  usernameColor,
  countryCode,
  dateOfBirth,
}: Props) {
  const [state, formAction] = useFormState(updateProfileDetails, undefined);

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
          Used to hide NSFW content if you are under 18.
        </span>
      </label>

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
