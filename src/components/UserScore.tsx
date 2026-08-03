type Props = {
  score: number;
  size?: "sm" | "lg";
};

export function UserScore({ score, size = "sm" }: Props) {
  if (size === "lg") {
    return (
      <div className="text-right shrink-0">
        <p className="text-3xl font-semibold tabular-nums leading-none">{score}</p>
        <p className="text-sm text-neutral-500 mt-1">
          {score === 1 ? "point" : "points"}
        </p>
      </div>
    );
  }

  return (
    <span className="text-xs text-neutral-500 tabular-nums">
      {score} {score === 1 ? "point" : "points"}
    </span>
  );
}
