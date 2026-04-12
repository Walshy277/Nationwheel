import Link from "next/link";
import {
  rankNations,
  rankOverallNations,
  type LeaderboardKey,
  type RankedNation,
} from "@nation-wheel/shared";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listNationSummaries } from "@/lib/nations";

const boards: Array<{ key: LeaderboardKey; title: string; note: string }> = [
  {
    key: "overall",
    title: "Overall Ranking",
    note: "Average rank across GDP, military, land area, population, and HDI.",
  },
  {
    key: "gdp",
    title: "GDP",
    note: "Total nominal GDP normalized from canon GDP entries.",
  },
  {
    key: "military",
    title: "Military Size",
    note: "Military score normalized onto the 0-11 scale.",
  },
  {
    key: "area",
    title: "Land Area",
    note: "Square kilometers from canon area data.",
  },
  { key: "population", title: "Population", note: "Total population." },
  { key: "hdi", title: "HDI", note: "Highest Human Development Index first." },
];

function getBoardRows(
  nations: Awaited<ReturnType<typeof listNationSummaries>>,
  key: LeaderboardKey,
) {
  if (key === "overall") return rankOverallNations(nations);
  return rankNations(nations, key);
}

function LeaderboardTable({ rows }: { rows: RankedNation[] }) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-lg border border-white/10 bg-black/15">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
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
              className="border-b border-white/5 hover:bg-emerald-300/5"
            >
              <td className="py-3 pr-4 font-mono text-emerald-200">
                #{entry.rank}
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
          Compare nations by economy, military strength, land area, population,
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
                  {rows.length} ranked
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
