import Link from "next/link";
import Image from "next/image";
import {
  formatNumber,
  rankNations,
  rankOverallNations,
  type NationSummary,
} from "@nation-wheel/shared";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listActivityFeed } from "@/lib/activity";
import { listNationSummaries } from "@/lib/nations";

const featuredSlots = [
  { key: "area", label: "Most Land", detail: "Land area" },
  { key: "population", label: "Highest Population", detail: "Population" },
  { key: "gdp", label: "Largest GDP", detail: "GDP" },
  { key: "military", label: "Largest Military", detail: "Military score" },
  { key: "hdi", label: "Highest HDI", detail: "HDI" },
] as const;

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
  const isGdp = detail === "GDP";

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
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              {detail}
            </p>
            {isGdp ? (
              <Image
                src="/assets/currency.png"
                alt="Global currency"
                width={24}
                height={24}
                className="h-6 w-6 rounded-md object-cover"
              />
            ) : null}
          </div>
          <p className="mt-2 text-xl font-black text-emerald-100">{value}</p>
        </div>
      </Panel>
    </Link>
  );
}

export async function HomeContent() {
  const [nations, activity] = await Promise.all([
    listNationSummaries(),
    listActivityFeed(),
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

  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <Badge tone="accent">{nationCount} canon nations</Badge>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Image
              src="/assets/nationwheel_logo.jpg"
              alt="Nation Wheel"
              width={84}
              height={84}
              className="h-20 w-20 rounded-lg border border-emerald-300/35 object-cover shadow-xl shadow-black/30"
              priority
            />
            <h1 className="max-w-3xl text-5xl font-black leading-tight text-zinc-50 md:text-6xl">
              Nation Wheel
            </h1>
          </div>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
            Top nations by land, population, GDP, military, HDI, and overall
            strength.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/compare"
              className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200"
            >
              Compare Nations
            </Link>
            <Link
              href="/leaderboards"
              className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:border-emerald-300 hover:bg-white/5"
            >
              Leaderboards
            </Link>
            <Link
              href="/nations"
              className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:border-emerald-300 hover:bg-white/5"
            >
              Browse Nations
            </Link>
          </div>
        </div>
        <Panel>
          <Badge tone="warning">Live queue</Badge>
          <h2 className="mt-4 text-2xl font-bold text-zinc-50">
            Latest Activity
          </h2>
          <div className="mt-4 grid gap-3">
            {activity.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/nations/${item.nationSlug}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/70 hover:bg-white/5"
              >
                <span className="block text-sm font-bold text-zinc-50">
                  {item.nationName}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-zinc-300">
                  {item.title}: {item.detail}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/activity"
            className="mt-4 inline-block rounded-lg border border-amber-300/70 px-4 py-2 text-sm font-bold text-amber-50 hover:bg-amber-300/10"
          >
            Open Activity Feed
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
