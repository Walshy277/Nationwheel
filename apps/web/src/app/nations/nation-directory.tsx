"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  formatMoney,
  formatNumber,
  getGdpTotal,
  parseArea,
  parseCompactNumber,
  type NationSummary,
} from "@nation-wheel/shared";
import { Badge, Panel } from "@/components/ui/shell";

type SortKey = "name" | "population" | "area" | "gdp";

function compareNumbers(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

export function NationDirectory({ nations }: { nations: NationSummary[] }) {
  const [query, setQuery] = useState("");
  const [government, setGovernment] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");

  const governments = useMemo(
    () =>
      Array.from(new Set(nations.map((nation) => nation.government))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [nations],
  );

  const visibleNations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return nations
      .filter((nation) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          nation.name.toLowerCase().includes(normalizedQuery) ||
          (nation.leaderName?.toLowerCase().includes(normalizedQuery) ??
            false) ||
          nation.government.toLowerCase().includes(normalizedQuery) ||
          nation.economy.toLowerCase().includes(normalizedQuery) ||
          nation.military.toLowerCase().includes(normalizedQuery);
        const matchesGovernment =
          government === "all" || nation.government === government;
        return matchesQuery && matchesGovernment;
      })
      .sort((left, right) => {
        if (sort === "population")
          return compareNumbers(
            parseCompactNumber(left.people),
            parseCompactNumber(right.people),
          );
        if (sort === "area")
          return compareNumbers(parseArea(left.area), parseArea(right.area));
        if (sort === "gdp")
          return compareNumbers(getGdpTotal(left), getGdpTotal(right));
        return left.name.localeCompare(right.name);
      });
  }, [government, nations, query, sort]);

  return (
    <div className="grid gap-5">
      <Panel className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">
            Search nations
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, government, economy, or military"
            suppressHydrationWarning
            className="min-h-11 min-w-0 px-3"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">
            Government
          </span>
          <select
            value={government}
            onChange={(event) => setGovernment(event.target.value)}
            className="min-h-11 min-w-0 px-3"
          >
            <option value="all">All governments</option>
            {governments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="min-h-11 min-w-0 px-3"
          >
            <option value="name">Name</option>
            <option value="population">Population</option>
            <option value="area">Land area</option>
            <option value="gdp">GDP</option>
          </select>
        </label>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <span>
          Showing{" "}
          <strong className="text-zinc-100">{visibleNations.length}</strong> of{" "}
          {nations.length}
        </span>
        {query || government !== "all" || sort !== "name" ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGovernment("all");
              setSort("name");
            }}
            className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-zinc-200 hover:border-emerald-300/70 hover:bg-white/5"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleNations.map((nation) => {
          const area = parseArea(nation.area);
          const gdp = getGdpTotal(nation);
          const usesBobakoin = nation.economy
            .toLowerCase()
            .includes("bobakoin");
          return (
            <Link
              key={nation.slug}
              href={`/nations/${nation.slug}`}
              className="group block"
            >
              <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative grid aspect-[3/2] w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-emerald-300/10 p-1 text-sm font-black text-emerald-100">
                      {nation.flagImage ? (
                        <Image
                          src={nation.flagImage}
                          alt={`${nation.name} flag`}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-contain"
                        />
                      ) : (
                        nation.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold leading-7 text-zinc-50 sm:text-2xl">
                        {nation.name}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-400">
                        {nation.government}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase text-zinc-500">
                        {nation.leaderName
                          ? `Leader: ${nation.leaderName}`
                          : "Leader unassigned"}
                      </p>
                    </div>
                  </div>
                  <Badge tone="accent">Profile</Badge>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-zinc-300">
                  {nation.summary}
                </p>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <span className="block text-zinc-500">Population</span>
                    <strong className="mt-1 block break-words text-zinc-100">
                      {nation.people}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <span className="block text-zinc-500">Area</span>
                    <strong className="mt-1 block break-words text-zinc-100">
                      {area === null ? "Unknown" : `${formatNumber(area)} km2`}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <span className="block text-zinc-500">GDP</span>
                    <strong className="mt-1 block break-words text-zinc-100">
                      {formatMoney(gdp)}
                    </strong>
                  </div>
                </div>
                {usesBobakoin ? (
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200/20 bg-amber-200/10 p-3 text-sm font-semibold text-amber-50">
                    <Image
                      src="/assets/bobakoin_crypto.png"
                      alt="Bobakoin crypto coin"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    Bobakoin economy
                  </div>
                ) : null}
              </Panel>
            </Link>
          );
        })}
      </div>

      {visibleNations.length === 0 ? (
        <Panel className="text-zinc-300">No nations match those filters.</Panel>
      ) : null}
    </div>
  );
}
