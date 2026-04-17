import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listActivityFeed } from "@/lib/activity";
import { listNationSummaries } from "@/lib/nations";
import mapImage from "../../../../../assets/Final_map_S1.jpg";

export const metadata: Metadata = {
  title: "Nation Wheel Bot",
  description:
    "Open the Discord-friendly Nation Wheel bot index for profiles, actions, rankings, lore, and the world map.",
  alternates: { canonical: "/activity" },
};

const botLinks = [
  {
    title: "Nation Profiles",
    href: "/nations",
    text: "Search canon nations, leaders, stats, flags, and wiki pages.",
  },
  {
    title: "Canon Actions",
    href: "/actions",
    text: "Track current actions and browse the completed archive.",
  },
  {
    title: "Leaderboards",
    href: "/leaderboards",
    text: "Rank nations by land, GDP, army ranking, population, and HDI.",
  },
  {
    title: "World Map",
    href: "/map",
    text: "Open the Season 1 reference map.",
  },
  {
    title: "World News",
    href: "/news",
    text: "Read public reports from journalists and staff.",
  },
  {
    title: "Activity Archive",
    href: "/activity-archive",
    text: "Review older canon updates and tracked changes.",
  },
] as const;

export default async function ActivityPage() {
  const [nations, feed] = await Promise.all([
    listNationSummaries(),
    listActivityFeed(),
  ]);

  return (
    <PageShell>
      <section className="grid gap-6 overflow-hidden rounded-lg border border-white/10 bg-[#0b0e0b] p-5 shadow-2xl shadow-black/25 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:p-7">
        <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image
            src={mapImage}
            alt="Nation Wheel world map"
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.85),rgba(5,7,6,0.34))]" />
          <div className="absolute left-5 top-5 z-10 sm:left-7 sm:top-7">
            <Badge tone="accent">Discord Bot Index</Badge>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Nation Wheel
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-200">
              Fast links for Discord players: profiles, actions, rankings,
              lore, news, and the map.
            </p>
          </div>
        </div>

        <Panel className="h-full bg-[color:var(--panel-strong)]/90">
          <Image
            src="/assets/nationwheel_logo.jpg"
            alt="Nation Wheel"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-lg border border-emerald-300/35 object-cover"
            priority
          />
          <h2 className="mt-5 text-3xl font-black text-zinc-50">
            Bot Command Center
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Use Discord commands for quick lookups, then open the web tools here
            for the full profile, wiki, and tracker view.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Nations
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {nations.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Archive Items
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {feed.length}
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {botLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
              <h2 className="text-xl font-bold text-zinc-50 group-hover:text-emerald-100">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {item.text}
              </p>
            </Panel>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
