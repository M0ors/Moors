"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "moors_adult_board_ack";

type Props = {
  children: React.ReactNode;
};

export function AdultGate({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [acked, setAcked] = useState(false);

  useEffect(() => {
    try {
      setAcked(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setAcked(false);
    }
    setReady(true);
  }, []);

  function continueToAdult() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setAcked(true);
  }

  if (!ready) {
    return <div className="min-h-[40vh]" />;
  }

  if (acked) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[50vh]">
      <div className="blur-md pointer-events-none select-none opacity-60" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-white/40">
        <div className="max-w-md w-full border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">You are entering the 18+ area</h2>
          <p className="text-sm text-neutral-700 mb-6">
            This content is not suitable for all. The content shown is selectively
            approved. Any content found to breach TOS will be removed and result in
            a permanent ban.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={continueToAdult}>
              Continue
            </button>
            <button
              type="button"
              className="!bg-white !text-neutral-900"
              onClick={() => router.push("/")}
            >
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
