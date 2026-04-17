import Link from "next/link";
import Image from "next/image";
import {
  formatMoney,
  formatNumber,
  getGdpTotal,
  parseArea,
  parseCompactNumber,
  rankNations,
  rankOverallNations,
  type NationSummary,
} from "@nation-wheel/shared";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { formatGameDate, getGameClock } from "@/lib/game-clock";
import { listNationSummaries } from "@/lib/nations";
import mapImage from "../../../../assets/Final_map_S1.jpg";

const featuredSlots = [
  { key: "area", label: "Most Land", detail: "Land area" },
  { key: "population", label: "Highest Population", detail: "Population" },
  { key: "gdp", label: "Largest GDP", detail: "GDP" },
  { key: "military", label: "Highest Army Ranking", detail: "Army ranking" },
  { key: "hdi", label: "Highest HDI", detail: "HDI" },
] as const;

const quickLinkGroups = [
  {
    title: "Nations",
    links: [
      ["Site Directory", "/directory", "Find the right page or control panel."],
      ["Nation Directory", "/nations", "Search every nation profile."],
      [
        "Compare Nations",
        "/nations#compare",
        "Select 2-4 nations side by side.",
      ],
      [
        "Leaderboards",
        "/leaderboards",
        "Rank land, GDP, army ranking, population, and HDI.",
      ],
    ],
  },
  {
    title: "Canon",
    links: [
      ["Actions", "/actions", "Track current and completed canon actions."],
      ["World News", "/news", "Read the latest reports from journalists."],
      ["World Lore", "/lore", "Read the wider setting and canon."],
      ["Wars", "/wars", "Check active conflicts and outcomes."],
    ],
  },
  {
    title: "Reference",
    links: [
      ["Season Map", "/map", "Open the world reference map."],
      ["Bot Index", "/activity", "Open the Discord-friendly command center."],
    ],
  },
] as const;

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-black text-zinc-50">{value}</p>
    </div>
  );
}

function FeaturedCard({
  label,
  detail,
  nation,
  value,
  rank,
}: {
  label: string;
  detail: string;
  nation: NationSummary;
  value: string;
  rank: number;
}) {
  return (
    <Link href={`/nations/${nation.slug}`} className="group block">
      <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
        <div className="flex items-start justify-between gap-4">
          <Badge tone="accent">{label}</Badge>
          <span className="font-mono text-sm font-bold text-zinc-500">
            #{rank}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-black text-zinc-50">{nation.name}</h2>
        <p className="mt-2 text-sm text-zinc-400">{nation.government}</p>
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            {detail}
          </p>
          <p className="mt-2 text-xl font-black text-emerald-100">{value}</p>
        </div>
      </Panel>
    </Link>
  );
}

export async function LandingPage() {
  const [nations, gameClock] = await Promise.all([
    listNationSummaries(),
    getGameClock(),
  ]);
  const nationCount = nations.length;
  const featured = featuredSlots
    .map((slot) => {
      const [top] = rankNations(nations, slot.key);
      return top
        ? {
            ...slot,
            nation: top.nation as NationSummary,
            value: top.label,
            rank: top.rank,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const [overall] = rankOverallNations(nations);
  const overallScore =
    overall?.value !== null && overall?.value !== undefined
      ? `Average rank ${formatNumber(overall.value)}`
      : "Best all-round profile";
  const totalPopulation = nations.reduce(
    (sum, nation) => sum + (parseCompactNumber(nation.people) ?? 0),
    0,
  );
  const totalArea = nations.reduce(
    (sum, nation) => sum + (parseArea(nation.area) ?? 0),
    0,
  );
  const totalGdp = nations.reduce(
    (sum, nation) => sum + (getGdpTotal(nation) ?? 0),
    0,
  );

  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0b0e0b] p-5 shadow-2xl shadow-black/25 sm:p-7">
          <Image
            src={mapImage}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover opacity-24"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.94),rgba(5,7,6,0.76)_52%,rgba(5,7,6,0.42))]" />
          <div className="relative">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{nationCount} canon nations</Badge>
              <Badge tone="warning">{formatGameDate(gameClock)}</Badge>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Image
                src="/assets/nationwheel_logo.jpg"
                alt="Nation Wheel"
                width={84}
                height={84}
                className="h-20 w-20 rounded-lg border border-emerald-300/35 object-cover shadow-xl shadow-black/30"
                priority
              />
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-zinc-50 sm:text-5xl md:text-6xl">
                Nation Wheel
              </h1>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              Browse the canon, compare rival powers, track rankings, and
              follow the current in-game day as staff advances the world.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatPill
                label="Population"
                value={formatNumber(totalPopulation)}
              />
              <StatPill label="Land" value={`${formatNumber(totalArea)} km2`} />
              <StatPill label="GDP" value={formatMoney(totalGdp)} />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/nations#compare"
                className="w-full rounded-lg bg-emerald-300 px-5 py-3 text-center font-bold text-zinc-950 hover:bg-emerald-200 sm:w-auto"
              >
                Compare Nations
              </Link>
              <Link
                href="/actions"
                className="w-full rounded-lg border border-white/10 px-5 py-3 text-center font-bold text-zinc-100 hover:border-emerald-300 hover:bg-white/5 sm:w-auto"
              >
                Actions
              </Link>
              <Link
                href="/nations"
                className="w-full rounded-lg border border-white/10 px-5 py-3 text-center font-bold text-zinc-100 hover:border-emerald-300 hover:bg-white/5 sm:w-auto"
              >
                Browse Nations
              </Link>
            </div>
          </div>
        </div>
        <Panel className="grid gap-4">
          <Badge tone="neutral">World Index</Badge>
          <h2 className="text-2xl font-bold text-zinc-50">Start Here</h2>
          <div className="grid gap-5">
            {quickLinkGroups.map((group) => (
              <div key={group.title}>
                <div className="mb-2 text-xs font-bold uppercase text-zinc-500">
                  {group.title}
                </div>
                <div className="grid divide-y divide-white/10">
                  {group.links.map(([label, href, text]) => (
                    <Link
                      key={href}
                      href={href}
                      className="group grid gap-1 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="block font-bold text-zinc-50 group-hover:text-emerald-100">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-zinc-300">
                        {text}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/activity-archive"
            className="text-sm font-semibold text-zinc-400 hover:text-emerald-100"
          >
            Activity archive
          </Link>
        </Panel>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overall ? (
          <FeaturedCard
            label="Overall #1"
            detail="Overall ranking"
            nation={overall.nation as NationSummary}
            value={overallScore}
            rank={overall.rank}
          />
        ) : null}
        {featured.map((item) => (
          <FeaturedCard
            key={item.key}
            label={item.label}
            detail={item.detail}
            nation={item.nation}
            value={item.value}
            rank={item.rank}
          />
        ))}
      </section>
    </PageShell>
  );
}
