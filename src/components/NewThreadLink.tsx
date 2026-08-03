"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "moors_last_board";

function boardFromPath(pathname: string) {
  const match = pathname.match(/^\/boards\/([^/]+)/);
  return match?.[1] ?? null;
}

export function NewThreadLink() {
  const pathname = usePathname();
  const pathBoard = boardFromPath(pathname);
  const [board, setBoard] = useState(pathBoard ?? "general");

  useEffect(() => {
    if (pathBoard) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, pathBoard);
      } catch {
        // ignore
      }
      setBoard(pathBoard);
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBoard(stored);
        return;
      }
    } catch {
      // ignore
    }
    setBoard("general");
  }, [pathBoard]);

  return <Link href={`/threads/new?board=${board}`}>New thread</Link>;
}
