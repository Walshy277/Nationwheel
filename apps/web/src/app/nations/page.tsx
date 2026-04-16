import type { Metadata } from "next";
import { Badge, PageShell } from "@/components/ui/shell";
import { NationCompare } from "@/components/compare/nation-compare";
import { listNationSummaries } from "@/lib/nations";
import { NationDirectory } from "./nation-directory";

export const metadata: Metadata = {
  title: "Nation Profiles",
  description:
    "Search, filter, compare, and open every Nation Wheel canon nation profile.",
  alternates: { canonical: "/nations" },
};

export default async function NationsPage() {
  const nations = await listNationSummaries();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge>Nations Registry</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Nation Profiles
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Search every canon nation, compare profiles, filter by government,
          and sort by population, land, or GDP.
        </p>
      </div>
      <NationDirectory nations={nations} />
      <section id="compare" className="scroll-mt-24">
        <div className="mb-5">
          <Badge tone="accent">Compare Nations</Badge>
          <h2 className="mt-4 text-3xl font-black text-zinc-50">
            Nation Compare
          </h2>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Select two to four nations and compare population, GDP, military,
            land, HDI, government, and economy side by side.
          </p>
        </div>
        <NationCompare nations={nations} />
      </section>
    </PageShell>
  );
}
