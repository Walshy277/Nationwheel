"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function GlobalSearchForm({
  compact = false,
  initialQuery = "",
}: {
  compact?: boolean;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form
      onSubmit={submitSearch}
      role="search"
      className={compact ? "hidden min-w-56 lg:block" : "grid gap-2"}
    >
      <label className={compact ? "sr-only" : "text-sm font-bold text-zinc-200"}>
        Search everywhere
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 focus-within:border-emerald-300/60">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-zinc-500"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, nations, actions..."
          className="min-h-7 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm outline-none"
        />
      </div>
    </form>
  );
}
