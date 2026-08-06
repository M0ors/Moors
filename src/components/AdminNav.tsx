import Link from "next/link";

export type AdminTab =
  | "images"
  | "access"
  | "announcements"
  | "sub-boards"
  | "badges"
  | "users";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "access", label: "Access" },
  { id: "announcements", label: "Announcements" },
  { id: "sub-boards", label: "Sub-boards" },
  { id: "badges", label: "Badges" },
  { id: "users", label: "Users" },
];

type Props = {
  active: AdminTab;
  counts?: Partial<Record<AdminTab, number>>;
  /** When set, only these tabs are shown (e.g. mods see Images only). */
  allowedTabs?: AdminTab[];
};

export function AdminNav({ active, counts, allowedTabs }: Props) {
  const tabs = allowedTabs
    ? TABS.filter((tab) => allowedTabs.includes(tab.id))
    : TABS;

  return (
    <nav className="flex flex-wrap gap-2 border-b mb-8 pb-3" aria-label="Admin sections">
      {tabs.map((tab) => {
        const count = counts?.[tab.id];
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/admin?tab=${tab.id}`}
            className={`no-underline px-3 py-1.5 text-sm border rounded ${
              isActive
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-900 border-neutral-300"
            }`}
          >
            {tab.label}
            {typeof count === "number" && count > 0 ? (
              <span className="ml-1.5 text-xs opacity-80">({count})</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function parseAdminTab(
  value: string | undefined,
  allowedTabs?: AdminTab[]
): AdminTab {
  const allowed = allowedTabs ?? [
    "images",
    "access",
    "announcements",
    "sub-boards",
    "badges",
    "users",
  ];

  if (
    value === "images" ||
    value === "access" ||
    value === "announcements" ||
    value === "sub-boards" ||
    value === "badges" ||
    value === "users"
  ) {
    if (allowed.includes(value)) {
      return value;
    }
  }

  return allowed[0] ?? "images";
}
