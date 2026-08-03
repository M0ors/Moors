import Link from "next/link";

export type AdminTab =
  | "images"
  | "access"
  | "sub-boards"
  | "badges"
  | "users";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "access", label: "Access" },
  { id: "sub-boards", label: "Sub-boards" },
  { id: "badges", label: "Badges" },
  { id: "users", label: "Users" },
];

type Props = {
  active: AdminTab;
  counts?: Partial<Record<AdminTab, number>>;
};

export function AdminNav({ active, counts }: Props) {
  return (
    <nav className="flex flex-wrap gap-2 border-b mb-8 pb-3" aria-label="Admin sections">
      {TABS.map((tab) => {
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

export function parseAdminTab(value?: string): AdminTab {
  if (
    value === "images" ||
    value === "access" ||
    value === "sub-boards" ||
    value === "badges" ||
    value === "users"
  ) {
    return value;
  }
  return "images";
}
