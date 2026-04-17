"use client";

import { useEffect, useState } from "react";

export function ControlSearch({
  label = "Search this panel",
  placeholder = "Search by name, title, role, nation, or keyword",
  targetId,
}: {
  label?: string;
  placeholder?: string;
  targetId: string;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.getElementById(targetId);
    if (!root) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-control-search-item]"),
    );
    const normalized = query.trim().toLowerCase();

    for (const item of items) {
      const haystack = (
        item.dataset.search ??
        item.textContent ??
        ""
      ).toLowerCase();
      const matches = normalized.length === 0 || haystack.includes(normalized);
      item.hidden = !matches;
    }
  }, [query, targetId]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold text-zinc-200">{label}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-h-11 px-3"
        />
      </label>
      {query ? (
        <p className="mt-2 text-xs text-zinc-500">Filtered results.</p>
      ) : null}
    </div>
  );
}
