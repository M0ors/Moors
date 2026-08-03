import Image from "next/image";
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
    <div className="flex items-center gap-3 text-sm">
      <form action={castVote}>
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="value" value={1} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <button
          type="submit"
          disabled={!canVote}
          aria-label={`Like (${likeCount})`}
          className={`!px-2 !py-1 inline-flex items-center gap-1.5 !bg-transparent !border-0 ${
            userVote === 1 ? "opacity-100 ring-2 ring-neutral-900 rounded" : "opacity-80"
          } ${!canVote ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Image
            src="/like.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-neutral-900">{likeCount}</span>
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
          aria-label={`Dislike (${dislikeCount})`}
          className={`!px-2 !py-1 inline-flex items-center gap-1.5 !bg-transparent !border-0 ${
            userVote === -1 ? "opacity-100 ring-2 ring-neutral-900 rounded" : "opacity-80"
          } ${!canVote ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Image
            src="/dislike.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-neutral-900">{dislikeCount}</span>
        </button>
      </form>
    </div>
  );
}
