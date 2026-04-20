import type { Metadata } from "next";
import Link from "next/link";
import {
  rankNations,
  rankOverallNations,
  type LeaderboardKey,
  type NationSummary,
  type RankedNation,
} from "@nation-wheel/shared";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listNationSummaries } from "@/lib/nations";

const boards: Array<{ key: LeaderboardKey; title: string; note: string }> = [
  {
    key: "overall",
    title: "Overall Ranking",
    note: "Average rank across GDP, army ranking, land area, population, and HDI.",
  },
  {
    key: "gdp",
    title: "GDP",
    note: "Total nominal GDP normalized from canon GDP entries.",
  },
  {
    key: "military",
    title: "Army Ranking",
    note: "Normalized 0-11 army ranking score, separate from army size.",
  },
  {
    key: "area",
    title: "Land Area",
    note: "Square kilometers from canon area data.",
  },
  { key: "population", title: "Population", note: "Total population." },
  { key: "hdi", title: "HDI", note: "Highest Human Development Index first." },
];

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "Rank Nation Wheel nations by GDP, army ranking, land area, population, HDI, and overall standing.",
  alternates: { canonical: "/leaderboards" },
};

type BoardRow = RankedNation & {
  ranked: boolean;
};

function getBoardRows(nations: NationSummary[], key: LeaderboardKey) {
  const rankedRows =
    key === "overall" ? rankOverallNations(nations) : rankNations(nations, key);
  const rows: BoardRow[] = rankedRows.map((row) => ({
    ...row,
    ranked: true,
  }));

  if (key === "overall") return rows;

  const rankedSlugs = new Set(rankedRows.map((entry) => entry.nation.slug));
  const unrankedRows: BoardRow[] = nations
    .filter((nation) => !rankedSlugs.has(nation.slug))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((nation) => ({
      nation,
      rank: 0,
      value: null,
      label: "Unknown",
      ranked: false,
    }));

  return [...rows, ...unrankedRows];
}

function LeaderboardTable({ rows }: { rows: BoardRow[] }) {
  return (
    <div className="max-h-[640px] overflow-auto rounded-lg border border-white/10 bg-black/15">
      <div className="grid gap-2 p-3 md:hidden">
        {rows.map((entry) => (
          <Link
            key={entry.nation.slug}
            href={`/nations/${entry.nation.slug}`}
            className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/70 hover:bg-emerald-900/5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="break-words font-bold text-zinc-50">
                {entry.nation.name}
              </span>
              <span className="shrink-0 font-mono text-sm text-emerald-200">
                {entry.ranked ? `#${entry.rank}` : "-"}
              </span>
            </div>
            <span className="break-words font-mono text-sm text-zinc-300">
              {entry.label}
            </span>
          </Link>
        ))}
      </div>
      <table className="hidden w-full min-w-[520px] border-collapse text-left text-sm md:table">
        <thead className="sticky top-0 bg-[#10120f] text-xs uppercase text-zinc-400">
          <tr className="border-b border-white/10">
            <th className="w-16 py-3 pr-4">Rank</th>
            <th className="py-3 pr-4">Nation</th>
            <th className="py-3 pr-4 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr
              key={entry.nation.slug}
              className="border-b border-white/5 hover:bg-emerald-900/5"
            >
              <td className="py-3 pr-4 font-mono text-emerald-200">
                {entry.ranked ? `#${entry.rank}` : "-"}
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/nations/${entry.nation.slug}`}
                  className="font-bold text-zinc-50 hover:text-emerald-200"
                >
                  {entry.nation.name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-zinc-200">
                {entry.label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="py-5 text-zinc-400">No ranked data available yet.</p>
      ) : null}
    </div>
  );
}

export default async function LeaderboardsPage() {
  const nations = await listNationSummaries();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">World Rankings</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">Leaderboards</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Compare nations by economy, army ranking, land area, population,
          HDI, and combined standing.
        </p>
      </div>

      <div className="grid gap-5">
        {boards.map((board) => {
          const rows = getBoardRows(nations, board.key);
          return (
            <Panel key={board.key}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-50">
                    {board.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {board.note}
                  </p>
                </div>
                <div className="text-sm font-bold text-emerald-200">
                  {rows.filter((row) => row.ranked).length} ranked /{" "}
                  {rows.length} listed
                </div>
              </div>
              <LeaderboardTable rows={rows} />
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
