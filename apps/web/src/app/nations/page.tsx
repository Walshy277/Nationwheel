import { Badge, PageShell } from "@/components/ui/shell";
import { listNationSummaries } from "@/lib/nations";
import { NationDirectory } from "./nation-directory";

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
          Search every canon nation, filter by government, and sort by
          population, land, or GDP.
        </p>
      </div>
      <NationDirectory nations={nations} />
    </PageShell>
  );
}
