import Link from "next/link";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { loreCpLinks } from "@/lib/control-panels";
import { listNationSummaries } from "@/lib/nations";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

export default async function LoreCpPage() {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const nations = await listNationSummaries();

  return (
    <ControlLayout title="LoreCP" links={loreCpLinks}>
      <div className="grid gap-4">
        <h1 className="text-3xl font-black text-white">Lore Control Panel</h1>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Panel className="grid gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Action Tracker</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Track canon TikTok actions, daily updates, timeframes, and spin
              requirements.
            </p>
            <Link href="/lorecp/actions" className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10">Edit Actions</Link>
          </Panel>
          <Panel className="grid gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Wars Page</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Publish active wars, frozen conflicts, and peace outcomes.
            </p>
            <Link href="/lorecp/pages/wars" className="rounded-lg border border-amber-300/70 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">Edit Wars</Link>
          </Panel>
          <Panel className="grid gap-3">
            <h2 className="text-xl font-bold text-zinc-50">World Lore</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Maintain the public canon hub, timeline, and world rules.
            </p>
            <Link href="/lorecp/pages/lore" className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10">Edit Lore</Link>
          </Panel>
          <Panel className="grid gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Universe Lore</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Publish the wider setting, history, factions, and canon guidance.
            </p>
            <Link href="/lorecp/pages/universe" className="rounded-lg border border-amber-300/70 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">Edit Universe</Link>
          </Panel>
        </div>
        {nations.map((nation) => (
          <Panel key={nation.id} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-bold text-white">{nation.name}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Stats, wiki moderation, and revision capture.
              </p>
            </div>
            <Link href={`/lorecp/nations/${nation.id}`} className="self-center rounded-lg border border-yellow-300/60 px-4 py-2 text-sm font-bold text-yellow-100">Review</Link>
          </Panel>
        ))}
      </div>
    </ControlLayout>
  );
}
