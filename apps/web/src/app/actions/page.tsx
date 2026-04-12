import { LoreActionStatus } from "@prisma/client";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";

async function getPublicActions() {
  try {
    return await getPrisma().loreAction.findMany({
      where: {
        status: {
          in: [LoreActionStatus.CURRENT, LoreActionStatus.REQUIRES_SPIN],
        },
      },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      include: {
        nation: { select: { name: true, slug: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function PublicActionsPage() {
  const actions = await getPublicActions();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Canon Tracker</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Ongoing Actions
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Current canon actions, estimated completion windows, spin
          requirements, and latest lore team updates.
        </p>
      </div>

      <div className="grid gap-4">
        {actions.map((action) => (
          <Panel key={action.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  action.status === LoreActionStatus.REQUIRES_SPIN
                    ? "warning"
                    : "accent"
                }
              >
                {action.status.replace("_", " ")}
              </Badge>
              <Badge>{action.type}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-zinc-50">
              <Link
                href={`/nations/${action.nation.slug}`}
                className="hover:text-emerald-200"
              >
                {action.nation.name}
              </Link>
            </h2>
            <p className="mt-2 text-sm font-semibold text-zinc-400">
              Estimated completion: {action.timeframe}
            </p>
            <p className="mt-4 leading-7 text-zinc-300">{action.action}</p>
            {action.requiresSpinReason ? (
              <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                Requires spin: {action.requiresSpinReason}
              </p>
            ) : null}
            {action.updates.length ? (
              <div className="mt-5 grid gap-2">
                <h3 className="text-sm font-bold uppercase text-zinc-400">
                  Latest Updates
                </h3>
                {action.updates.map((update) => (
                  <div
                    key={update.id}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <p className="text-sm leading-6 text-zinc-300">
                      {update.content}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {update.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        ))}
        {actions.length === 0 ? (
          <Panel className="text-zinc-300">
            No ongoing canon actions have been published yet.
          </Panel>
        ) : null}
      </div>
    </PageShell>
  );
}
