import type { Metadata } from "next";
import { NationMap } from "@/components/map/nation-map";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listNationSummaries } from "@/lib/nations";

export const metadata: Metadata = {
  title: "World Map",
  description: "Open the Nation Wheel world reference map and nation index.",
  alternates: { canonical: "/map" },
};

export default async function MapPage() {
  const nations = await listNationSummaries();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Strategic Map</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-50">
          World Map
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Static Season 1 cartography for reference while nation details stay in
          profiles and wiki pages.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <NationMap />
        <Panel>
          <div className="text-xs font-bold uppercase text-zinc-400">
            Reference Index
          </div>
          <h2 className="mt-3 text-2xl font-bold text-zinc-50">
            Nation Profiles
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Use the nation directory for stats, leaders, and wiki entries. The
            map is a still reference image.
          </p>
          <div className="mt-5 grid max-h-[420px] gap-2 overflow-y-auto pr-2 text-sm">
            {nations.map((nation) => (
              <a
                key={nation.slug}
                href={`/nations/${nation.slug}`}
                className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-zinc-200 hover:border-emerald-300"
              >
                {nation.name}
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
