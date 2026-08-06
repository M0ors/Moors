"use client";

import { useEffect, useRef } from "react";

const CLIENT_THROTTLE_MS = 45_000;

export function ActivityTracker() {
  const lastSent = useRef(0);

  useEffect(() => {
    const ping = () => {
      const now = Date.now();
      if (now - lastSent.current < CLIENT_THROTTLE_MS) return;
      lastSent.current = now;
      void fetch("/api/activity", { method: "POST", keepalive: true }).catch(
        () => undefined
      );
    };

    // Mark active on load and on clicks / taps / keys
    ping();
    window.addEventListener("pointerdown", ping);
    window.addEventListener("keydown", ping);

    return () => {
      window.removeEventListener("pointerdown", ping);
      window.removeEventListener("keydown", ping);
    };
  }, []);

  return null;
}
