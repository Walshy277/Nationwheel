"use client";

import { type ReactNode, useState } from "react";

export function CompletedActionsToggle({
  count,
  children,
  label = "completed actions",
}: {
  count: number;
  children: ReactNode;
  label?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-expanded={isVisible}
        className="w-fit rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/50 hover:bg-white/5"
      >
        {isVisible ? "Hide" : "Show"} {count} {label}
      </button>
      {isVisible ? children : null}
    </div>
  );
}
