import type { Metadata } from "next";
import { LoreActionStatus } from "@prisma/client";
import Link from "next/link";
import { CompletedActionsToggle } from "@/components/actions/completed-actions-toggle";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Actions",
  description:
    "Track current Nation Wheel canon actions, completion windows, spin requirements, and lore team updates.",
  alternates: { canonical: "/actions" },
};

function timeoutAfter<T>(milliseconds: number, fallback: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), milliseconds);
  });
}

async function getPublicActions() {
  try {
    const result = await Promise.race([
      Promise.all([
        getPrisma().loreAction.findMany({
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
        }),
        getPrisma().loreAction.findMany({
          where: { status: LoreActionStatus.COMPLETED },
          orderBy: { updatedAt: "desc" },
          take: 40,
          include: {
            nation: { select: { name: true, slug: true } },
            updates: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        }),
      ]),
      timeoutAfter(8000, null),
    ]);

    if (!result) return { active: [], completed: [] };

    return { active: result[0], completed: result[1] };
  } catch {
    return { active: [], completed: [] };
  }
}

export default async function PublicActionsPage() {
  const { active, completed } = await getPublicActions();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Canon Tracker</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Ongoing Actions
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Current canon actions, estimated completion windows, spin
          requirements, latest lore team updates, and a completed archive.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="#active"
            className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
          >
            Active Actions
          </a>
          <a
            href="#completed"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
          >
            Completed Archive
          </a>
          {active[0] ? (
            <Link
              href={`/actions/${active[0].id}`}
              className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800"
            >
              Open Latest Action
            </Link>
          ) : null}
        </div>
      </div>

      <section id="active" className="grid scroll-mt-24 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge tone="accent">Active Board</Badge>
            <h2 className="mt-3 text-3xl font-black text-zinc-50">
              Current Work
            </h2>
          </div>
          <Badge>{active.length} active</Badge>
        </div>
        {active.map((action) => (
          <Panel key={action.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <Link
                href={`/actions/${action.id}`}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
              >
                Open Action
              </Link>
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
            <div className="mt-4">
              <WikiRenderer content={action.action} />
            </div>
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
                    <WikiRenderer content={update.content} />
                    <p className="mt-2 text-xs text-zinc-500">
                      {update.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        ))}
        {active.length === 0 ? (
          <Panel className="text-zinc-300">
            No ongoing canon actions have been published yet.
          </Panel>
        ) : null}
      </section>

      <section id="completed" className="grid scroll-mt-24 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge tone="neutral">Completed Actions Archive</Badge>
            <h2 className="mt-3 text-3xl font-black text-zinc-50">
              Completed Archive
            </h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              Finished canon actions are kept here for later reference.
            </p>
          </div>
          <Badge>{completed.length} archived</Badge>
        </div>
        <CompletedActionsToggle count={completed.length}>
          <div className="grid gap-3">
            {completed.map((action) => (
            <Panel key={action.id} className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{action.type}</Badge>
                    <Badge tone="accent">Completed</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-zinc-50">
                    <Link
                      href={`/nations/${action.nation.slug}`}
                      className="hover:text-emerald-200"
                    >
                      {action.nation.name}
                    </Link>
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-500">
                    {action.updatedAt.toLocaleString("en-GB")}
                  </span>
                  <Link
                    href={`/actions/${action.id}`}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                  >
                    Open Action
                  </Link>
                </div>
              </div>
              <div className="line-clamp-3">
                <WikiRenderer content={action.action} />
              </div>
              {action.outcome ? (
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-900/10 p-3">
                  <p className="text-xs font-bold uppercase text-emerald-100">
                    Outcome
                  </p>
                  <div className="mt-2">
                    <WikiRenderer content={action.outcome} />
                  </div>
                </div>
              ) : null}
              {action.updates[0] ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Final update
                  </p>
                  <div className="mt-2">
                    <WikiRenderer content={action.updates[0].content} />
                  </div>
                </div>
              ) : null}
              </Panel>
            ))}
            {completed.length === 0 ? (
              <Panel className="text-zinc-300">
                No completed actions have been archived yet.
              </Panel>
            ) : null}
          </div>
        </CompletedActionsToggle>
      </section>
    </PageShell>
  );
}
