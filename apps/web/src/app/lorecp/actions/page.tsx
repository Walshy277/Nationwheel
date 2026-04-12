import { LoreActionStatus, Role } from "@prisma/client";
import {
  addLoreActionUpdateAction,
  createLoreActionAction,
  updateLoreActionStatusAction,
} from "@/app/actions";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

const links = [
  { href: "/lorecp", label: "Nation Review" },
  { href: "/lorecp/actions", label: "Action Tracker" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
];

const columns = [
  {
    status: LoreActionStatus.CURRENT,
    title: "Current Actions",
    empty: "No active canon actions are being tracked.",
  },
  {
    status: LoreActionStatus.REQUIRES_SPIN,
    title: "Requires Spin",
    empty: "No actions are waiting on a spin.",
  },
  {
    status: LoreActionStatus.COMPLETED,
    title: "Completed Actions",
    empty: "No completed actions yet.",
  },
];

export default async function LoreActionsPage() {
  await requirePageRole([Role.LORE, Role.ADMIN]);
  const [nations, actions] = await Promise.all([
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getPrisma().loreAction.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        nation: { select: { name: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { createdByUser: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);

  return (
    <ControlLayout title="LoreCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <Badge tone="warning">Daily lore loop</Badge>
          <h1 className="mt-4 text-3xl font-black text-zinc-50">
            Action Tracker
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Watch TikTok actions, decide what becomes canon, set an approximate
            completion timeframe, then post daily updates leaders can follow.
            Actions marked as requiring a spin are flagged for Rygaa.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-zinc-50">Create Action</h2>
          <form
            action={createLoreActionAction}
            className="mt-5 grid gap-3 lg:grid-cols-2"
          >
            <select name="nationId" required className="px-3 py-2">
              <option value="">Select nation</option>
              {nations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  {nation.name}
                </option>
              ))}
            </select>
            <input
              name="type"
              required
              placeholder="Action type"
              className="px-3 py-2"
            />
            <input
              name="timeframe"
              required
              placeholder="Approx. timeframe"
              className="px-3 py-2"
            />
            <select
              name="status"
              defaultValue={LoreActionStatus.CURRENT}
              className="px-3 py-2"
            >
              <option value={LoreActionStatus.CURRENT}>Current</option>
              <option value={LoreActionStatus.REQUIRES_SPIN}>
                Requires spin
              </option>
              <option value={LoreActionStatus.COMPLETED}>Completed</option>
            </select>
            <input
              name="source"
              placeholder="TikTok source or note"
              className="px-3 py-2 lg:col-span-2"
            />
            <textarea
              name="action"
              required
              placeholder="Nation:, Action Type:, Action:"
              className="min-h-32 p-3 lg:col-span-2"
            />
            <input
              name="requiresSpinReason"
              placeholder="Spin reason, if needed"
              className="px-3 py-2 lg:col-span-2"
            />
            <button className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-zinc-950 hover:bg-amber-200 lg:col-span-2">
              Track Action
            </button>
          </form>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-3">
          {columns.map((column) => {
            const items = actions.filter(
              (action) => action.status === column.status,
            );
            return (
              <Panel key={column.status} className="content-start">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-zinc-50">
                    {column.title}
                  </h2>
                  <Badge
                    tone={
                      column.status === LoreActionStatus.REQUIRES_SPIN
                        ? "warning"
                        : "accent"
                    }
                  >
                    {items.length}
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {items.map((action) => (
                    <article
                      key={action.id}
                      className="rounded-lg border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{action.nation.name}</Badge>
                        <Badge tone="accent">{action.type}</Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-zinc-300">
                        Timeframe: {action.timeframe}
                      </p>
                      {action.source ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          Source: {action.source}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {action.action}
                      </p>
                      {action.requiresSpinReason ? (
                        <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                          Spin needed: {action.requiresSpinReason}
                        </p>
                      ) : null}
                      {action.rygaaNotifiedAt ? (
                        <p className="mt-2 text-xs text-amber-200">
                          Rygaa notification logged{" "}
                          {action.rygaaNotifiedAt.toLocaleString("en-GB")}.
                        </p>
                      ) : null}

                      <form
                        action={addLoreActionUpdateAction.bind(null, action.id)}
                        className="mt-4 grid gap-2"
                      >
                        <textarea
                          name="content"
                          required
                          placeholder="Daily update"
                          className="min-h-24 p-3 text-sm"
                        />
                        <button className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10">
                          Add Update
                        </button>
                      </form>

                      <form
                        action={updateLoreActionStatusAction.bind(
                          null,
                          action.id,
                        )}
                        className="mt-3 grid gap-2"
                      >
                        <select
                          name="status"
                          defaultValue={action.status}
                          className="px-3 py-2 text-sm"
                        >
                          <option value={LoreActionStatus.CURRENT}>
                            Current
                          </option>
                          <option value={LoreActionStatus.REQUIRES_SPIN}>
                            Requires spin
                          </option>
                          <option value={LoreActionStatus.COMPLETED}>
                            Completed
                          </option>
                        </select>
                        <input
                          name="requiresSpinReason"
                          defaultValue={action.requiresSpinReason ?? ""}
                          placeholder="Spin reason"
                          className="px-3 py-2 text-sm"
                        />
                        <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                          Update Status
                        </button>
                      </form>

                      {action.updates.length ? (
                        <div className="mt-4 grid gap-2">
                          {action.updates.map((update) => (
                            <div
                              key={update.id}
                              className="rounded-md border border-white/10 bg-black/20 p-3"
                            >
                              <p className="text-sm leading-6 text-zinc-300">
                                {update.content}
                              </p>
                              <p className="mt-2 text-xs text-zinc-500">
                                {update.createdAt.toLocaleString("en-GB")} by{" "}
                                {update.createdByUser?.name ??
                                  update.createdByUser?.email ??
                                  "Lore team"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-400">{column.empty}</p>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </ControlLayout>
  );
}
