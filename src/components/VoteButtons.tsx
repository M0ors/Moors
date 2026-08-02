import { castVote } from "@/app/actions/votes";

type Props = {
  targetType: "thread" | "post";
  targetId: string;
  likeCount: number;
  dislikeCount: number;
  userVote: number | null;
  redirectTo: string;
  canVote: boolean;
};

export function VoteButtons({
  targetType,
  targetId,
  likeCount,
  dislikeCount,
  userVote,
  redirectTo,
  canVote,
}: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <form action={castVote}>
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="value" value={1} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <button
          type="submit"
          disabled={!canVote}
          className={`!px-2 !py-1 ${
            userVote === 1 ? "!bg-neutral-900 !text-white" : "!bg-white !text-neutral-900"
          }`}
        >
          ▲ {likeCount}
        </button>
      </form>
      <form action={castVote}>
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="value" value={-1} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <button
          type="submit"
          disabled={!canVote}
          className={`!px-2 !py-1 ${
            userVote === -1 ? "!bg-neutral-900 !text-white" : "!bg-white !text-neutral-900"
          }`}
        >
          ▼ {dislikeCount}
        </button>
      </form>
    </div>
  );
}
