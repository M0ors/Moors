"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  initialPending: number;
};

function playDing() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    void ctx.resume();
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Ignore autoplay / AudioContext failures
  }
}

async function fetchPending(): Promise<number | null> {
  try {
    const res = await fetch("/api/staff-alerts", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { pending?: number };
    return typeof data.pending === "number" ? data.pending : null;
  } catch {
    return null;
  }
}

export function StaffAlertsLink({ label, initialPending }: Props) {
  const [pending, setPending] = useState(initialPending);
  const lastPending = useRef(initialPending);
  const primed = useRef(false);

  useEffect(() => {
    const unlock = () => {
      primed.current = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const next = await fetchPending();
      if (cancelled || next == null) return;

      if (next > lastPending.current && primed.current) {
        playDing();
      }
      lastPending.current = next;
      setPending(next);
    };

    const id = window.setInterval(tick, 20000);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const hasWork = pending > 0;

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 no-underline"
      title={
        hasWork
          ? `${pending} item(s) need attention`
          : "No pending images or access requests"
      }
    >
      <span className="underline">{label}</span>
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          hasWork ? "bg-orange-500" : "bg-green-500"
        }`}
        aria-hidden
      />
      <span className="sr-only">
        {hasWork
          ? `${pending} pending staff items`
          : "No pending staff items"}
      </span>
    </Link>
  );
}
