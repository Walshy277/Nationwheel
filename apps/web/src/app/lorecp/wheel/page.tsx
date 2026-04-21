import type { Metadata } from "next";
import Link from "next/link";
import { LoreActionStatus, Role } from "@prisma/client";
import { SpinWheel } from "@/components/control/spin-wheel";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { hasDatabase, loreCpLinks } from "@/lib/control-panels";
import { spinOptionsFromReason } from "@/lib/lore-spins";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Wheel Desk",
  description: "Weighted lore decision wheel for spin-required canon actions.",
  alternates: { canonical: "/lorecp/wheel" },
};

export default async function LoreWheelPage({
  searchParams,
}: {
  searchParams: Promise<{ actionId?: string }>;
}) {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  if (!hasDatabase()) {
    return (
      <ControlLayout title="LoreCP" links={loreCpLinks}>
        <Panel>
          <Badge tone="warning">Wheel Desk</Badge>
          <h1 className="mt-4 text-3xl font-black text-zinc-50">
            Weighted Decision Wheel
          </h1>
          <p className="mt-3 text-zinc-300">
            Connect the database to load spin-required canon actions.
          </p>
        </Panel>
      </ControlLayout>
    );
  }

  const { actionId } = await searchParams;
  const actions = await getPrisma().loreAction.findMany({
    where: { status: LoreActionStatus.REQUIRES_SPIN },
    orderBy: { updatedAt: "asc" },
    include: {
      nation: { select: { id: true, name: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { createdByUser: { select: { name: true, email: true } } },
      },
    },
  });

  const selectedAction =
    actions.find((action) => action.id === actionId) ?? actions[0] ?? null;

  return (
    <ControlLayout title="LoreCP" links={loreCpLinks}>
      <div className="grid gap-6">
        <Panel className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <Badge tone="warning">Wheel Desk</Badge>
            <h1 className="mt-4 text-4xl font-black text-zinc-50">
              Weighted Decision Wheel
            </h1>
            <p className="mt-3 max-w-3xl text-zinc-300">
              Pick a spin-required canon action, edit the prompt and weighted
              results, then save the outcome straight into the lore log.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-xs font-bold uppercase text-amber-100">
                Awaiting Spin
              </p>
              <p className="mt-1 text-2xl font-black text-amber-50">
                {actions.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Tracker
              </p>
              <Link
                href="/lorecp/actions"
                className="mt-2 inline-flex text-sm font-bold text-emerald-100 hover:text-emerald-200"
              >
                Open Action Tracker
              </Link>
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Panel className="content-start p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Queue
              </p>
              <h2 className="mt-1 text-2xl font-black text-zinc-50">
                Spin-required actions
              </h2>
            </div>
            <div className="divide-y divide-white/10">
              {actions.map((action) => {
                const active = action.id === selectedAction?.id;
                return (
                  <Link
                    key={action.id}
                    href={`/lorecp/wheel?actionId=${action.id}`}
                    className={`block px-5 py-4 ${active ? "bg-amber-300/10" : "hover:bg-white/[0.03]"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={active ? "warning" : "neutral"}>
                        {active ? "Open" : "Queued"}
                      </Badge>
                      <Badge>{action.nation.name}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-zinc-50">
                      {action.type}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-300">
                      {action.action}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Updated {action.updatedAt.toLocaleString("en-GB")}
                    </p>
                  </Link>
                );
              })}
              {actions.length === 0 ? (
                <div className="px-5 py-8 text-sm text-zinc-300">
                  No canon actions are waiting on a spin.
                </div>
              ) : null}
            </div>
          </Panel>

          <div className="grid gap-5">
            {selectedAction ? (
              <>
                <Panel>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">Selected Action</Badge>
                    <Badge>{selectedAction.nation.name}</Badge>
                    <Badge>{selectedAction.timeframe}</Badge>
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-zinc-50">
                    {selectedAction.type}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {selectedAction.action}
                  </p>
                  {selectedAction.requiresSpinReason ? (
                    <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
                        Spin Brief
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-50">
                        {selectedAction.requiresSpinReason}
                      </p>
                    </div>
                  ) : null}
                  {selectedAction.updates[0] ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Latest Update
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {selectedAction.updates[0].content}
                      </p>
                    </div>
                  ) : null}
                </Panel>

                <SpinWheel
                  actionId={selectedAction.id}
                  initialOptions={spinOptionsFromReason(
                    selectedAction.requiresSpinReason,
                  )}
                  initialPrompt={
                    selectedAction.requiresSpinReason?.slice(0, 200) ||
                    `Resolve ${selectedAction.nation.name}'s ${selectedAction.type}`
                  }
                  title={`${selectedAction.nation.name}: ${selectedAction.type}`}
                />
              </>
            ) : (
              <Panel>
                <h2 className="text-2xl font-black text-zinc-50">Queue clear</h2>
                <p className="mt-3 text-zinc-300">
                  The wheel desk is empty because no actions are currently marked
                  as requiring a spin.
                </p>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </ControlLayout>
  );
}
