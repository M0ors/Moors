import { Sidebar } from "@/components/Sidebar";
import type { PopularThread, SidebarOp } from "@/lib/popular";

type Props = {
  children: React.ReactNode;
  popularThreads: PopularThread[];
  op?: SidebarOp | null;
  canViewNsfw: boolean;
  hideNsfwOpDetails?: boolean;
};

export function ForumShell({
  children,
  popularThreads,
  op,
  canViewNsfw,
  hideNsfwOpDetails,
}: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">{children}</div>
      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <Sidebar
          popularThreads={popularThreads}
          op={op}
          canViewNsfw={canViewNsfw}
          hideNsfwOpDetails={hideNsfwOpDetails}
        />
      </div>
    </div>
  );
}
