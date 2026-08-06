import { Sidebar } from "@/components/Sidebar";
import { getSidebarAnnouncements } from "@/lib/announcements";
import type { PopularThread, SidebarOp } from "@/lib/popular";
import { getStaffMembers } from "@/lib/staff";

type Props = {
  children: React.ReactNode;
  popularThreads: PopularThread[];
  op?: SidebarOp | null;
  canViewNsfw: boolean;
  hideNsfwOpDetails?: boolean;
};

export async function ForumShell({
  children,
  popularThreads,
  op,
  canViewNsfw,
  hideNsfwOpDetails,
}: Props) {
  const [announcements, staff] = await Promise.all([
    getSidebarAnnouncements(),
    getStaffMembers(),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">{children}</div>
      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <Sidebar
          popularThreads={popularThreads}
          announcements={announcements}
          staff={staff}
          op={op}
          canViewNsfw={canViewNsfw}
          hideNsfwOpDetails={hideNsfwOpDetails}
        />
      </div>
    </div>
  );
}
