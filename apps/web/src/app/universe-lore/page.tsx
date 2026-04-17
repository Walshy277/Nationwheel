import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { getPublicContentPage } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Universe Lore",
  description:
    "Read the wider Nation Wheel universe lore, timeline, factions, and canon guidance.",
  alternates: { canonical: "/universe-lore" },
};

export default async function UniverseLorePage() {
  const page = await getPublicContentPage("universe");

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Universe Canon</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          {page.title}
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          The wider setting, history, factions, and canon rules behind Nation
          Wheel.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/lore"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
          >
            World Lore
          </Link>
          <Link
            href="/wars"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
          >
            Wars
          </Link>
        </div>
      </div>
      <Panel>
        <WikiRenderer content={page.content} />
      </Panel>
    </PageShell>
  );
}
