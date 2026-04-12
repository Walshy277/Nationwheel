import { Badge, PageShell } from "@/components/ui/shell";
import { listNationSummaries } from "@/lib/nations";
import { NationCompare } from "./nation-compare";

export default async function ComparePage() {
  const nations = await listNationSummaries();

  return (
    <PageShell>
      <div>
        <Badge tone="accent">Compare Nations</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Nation Compare
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Select two to four nations and compare population, GDP, military,
          land, HDI, government, and economy side by side.
        </p>
      </div>

      <NationCompare nations={nations} />
    </PageShell>
  );
}
