import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefForPage }: Props) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-6 flex items-center justify-between gap-4 text-sm">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)}>← Previous</Link>
      ) : (
        <span className="text-neutral-400">← Previous</span>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefForPage(page + 1)}>Next →</Link>
      ) : (
        <span className="text-neutral-400">Next →</span>
      )}
    </nav>
  );
}
