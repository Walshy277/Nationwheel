import Link from "next/link";
import { LoreActionStatus } from "@prisma/client";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, Panel } from "@/components/ui/shell";

type ActionWithRelations = {
  id: string;
  type: string;
  action: string;
  timeframe: string;
  status: LoreActionStatus;
  source: string | null;
  outcome: string | null;
  requiresSpinReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  nation: { name: string; slug: string };
  updates: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdByUser?: { name: string | null; email: string | null } | null;
  }>;
};

export function ActionDetailPanel({
  action,
  backHref,
  backLabel,
}: {
  action: ActionWithRelations;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-4 border-b border-white/10 pb-6">
        <Link
          href={backHref}
          className="text-sm font-bold text-emerald-100 hover:text-emerald-200"
        >
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={
              action.status === LoreActionStatus.REQUIRES_SPIN
                ? "warning"
                : action.status === LoreActionStatus.COMPLETED
                  ? "neutral"
                  : "accent"
            }
          >
            {action.status.replace("_", " ")}
          </Badge>
          <Badge>{action.type}</Badge>
          <Badge>{action.nation.name}</Badge>
        </div>
        <h1 className="text-4xl font-black text-zinc-50">{action.type}</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">Nation</p>
            <Link
              href={`/nations/${action.nation.slug}`}
              className="mt-2 inline-flex text-lg font-black text-zinc-50 hover:text-emerald-100"
            >
              {action.nation.name}
            </Link>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Estimated completion
            </p>
            <p className="mt-2 text-lg font-black text-zinc-50">
              {action.timeframe}
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Latest touch
            </p>
            <p className="mt-2 text-lg font-black text-zinc-50">
              {action.updatedAt.toLocaleString("en-GB")}
            </p>
          </Panel>
        </div>
      </header>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Action Brief</Badge>
          {action.source ? <Badge>{action.source}</Badge> : null}
        </div>
        <div className="mt-4">
          <WikiRenderer content={action.action} />
        </div>
        {action.requiresSpinReason ? (
          <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
              Spin Requirement
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-50">
              {action.requiresSpinReason}
            </p>
          </div>
        ) : null}
        {action.outcome ? (
          <div className="mt-5 rounded-lg border border-emerald-300/25 bg-emerald-900/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
              Outcome
            </p>
            <div className="mt-2">
              <WikiRenderer content={action.outcome} />
            </div>
          </div>
        ) : null}
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Update Log</h2>
          <Badge>{action.updates.length}</Badge>
        </div>
        {action.updates.length ? (
          action.updates.map((update, index) => (
            <Panel key={update.id} className="bg-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={index === 0 ? "warning" : "neutral"}>
                    {index === 0 ? "Latest" : `Update ${action.updates.length - index}`}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500">
                  {update.createdAt.toLocaleString("en-GB")} by{" "}
                  {update.createdByUser?.name ??
                    update.createdByUser?.email ??
                    "Lore team"}
                </p>
              </div>
              <div className="mt-4">
                <WikiRenderer content={update.content} />
              </div>
            </Panel>
          ))
        ) : (
          <Panel className="text-zinc-300">No updates have been posted yet.</Panel>
        )}
      </section>
    </div>
  );
}
