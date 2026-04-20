import { LoreActionStatus, Role } from "@prisma/client";
import {
  addLoreActionUpdateAction,
  completeLoreActionAction,
  createLoreActionAction,
  updateLoreActionAction,
  updateLoreActionStatusAction,
} from "@/app/actions";
import { DatabaseRequired } from "@/components/control/database-required";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, Panel } from "@/components/ui/shell";
import { hasDatabase, loreCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

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
];

function latestActionTouch(action: {
  updatedAt: Date;
  updates: Array<{ createdAt: Date }>;
}) {
  const latestUpdate = action.updates[0]?.createdAt;
  return latestUpdate && latestUpdate > action.updatedAt
    ? latestUpdate
    : action.updatedAt;
}

export default async function LoreActionsPage() {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  if (!hasDatabase()) {
    return (
      <ControlLayout title="LoreCP" links={loreCpLinks}>
        <div className="grid gap-5">
          <Panel>
            <Badge tone="warning">Daily lore loop</Badge>
            <h1 className="mt-4 text-3xl font-black text-zinc-50">
              Action Tracker
            </h1>
            <p className="mt-3 max-w-3xl text-zinc-300">
              Track canon TikTok actions, daily updates, timeframes, and spin
              requirements.
            </p>
          </Panel>
          <DatabaseRequired title="Action Storage Required" />
        </div>
      </ControlLayout>
    );
  }

  const [nations, actions] = await Promise.all([
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getPrisma().loreAction.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        nation: {
          select: {
            id: true,
            name: true,
            people: true,
            government: true,
            gdp: true,
            economy: true,
            military: true,
            area: true,
            geoPoliticalStatus: true,
            block: true,
            culture: true,
            hdi: true,
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { createdByUser: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);
  const activeActions = actions.filter(
    (action) => action.status !== LoreActionStatus.COMPLETED,
  );
  const completedActions = actions.filter(
    (action) => action.status === LoreActionStatus.COMPLETED,
  );
  const staleCutoff = new Date();
  staleCutoff.setHours(staleCutoff.getHours() - 24);
  const spinRequiredActions = activeActions.filter(
    (action) => action.status === LoreActionStatus.REQUIRES_SPIN,
  );
  const staleActions = activeActions.filter(
    (action) => latestActionTouch(action) < staleCutoff,
  );

  return (
    <ControlLayout title="LoreCP" links={loreCpLinks}>
      <div className="grid gap-6">
        <Panel>
          <Badge tone="warning">Daily lore loop</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Action Tracker
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Watch TikTok actions, decide what becomes canon, set an approximate
            completion timeframe, then post daily updates leaders can follow.
            Actions marked as requiring a spin are flagged for Rygaa.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Active
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {activeActions.length}
              </p>
            </div>
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-xs font-bold uppercase text-amber-100">
                Awaiting Spin
              </p>
              <p className="mt-1 text-2xl font-black text-amber-50">
                {
                  activeActions.filter(
                    (action) =>
                      action.status === LoreActionStatus.REQUIRES_SPIN,
                  ).length
                }
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Archived
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {completedActions.length}
              </p>
            </div>
          </div>
        </Panel>

        {(spinRequiredActions.length || staleActions.length) ? (
          <Panel className="border-amber-300/35 bg-amber-300/10">
            <Badge tone="warning">Staff Notifications</Badge>
            <h2 className="mt-3 text-2xl font-bold text-amber-50">
              Action attention needed
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-amber-200/20 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase text-amber-100">
                  Requires spin
                </p>
                <p className="mt-1 text-2xl font-black text-amber-50">
                  {spinRequiredActions.length}
                </p>
                <p className="mt-2 text-sm text-amber-100/80">
                  {spinRequiredActions
                    .slice(0, 4)
                    .map((action) => action.nation.name)
                    .join(", ") || "Clear"}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200/20 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase text-amber-100">
                  Ignored over 24 hours
                </p>
                <p className="mt-1 text-2xl font-black text-amber-50">
                  {staleActions.length}
                </p>
                <p className="mt-2 text-sm text-amber-100/80">
                  {staleActions
                    .slice(0, 4)
                    .map((action) => action.nation.name)
                    .join(", ") || "Clear"}
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        <Panel id="create-action" className="scroll-mt-28 bg-[color:var(--panel-strong)]/85">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="accent">Create / Track</Badge>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">
                Create Action
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Add new canon actions here, or use `/trackaction` in Discord.
              </p>
            </div>
          </div>
          <form
            action={createLoreActionAction}
            className="mt-5 grid gap-3 xl:grid-cols-2"
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
            </select>
            <input
              name="source"
              placeholder="TikTok source or note"
              className="px-3 py-2 xl:col-span-2"
            />
            <textarea
              name="action"
              required
              placeholder="Nation:, Action Type:, Action:"
              className="min-h-32 p-3 xl:col-span-2"
            />
            <input
              name="requiresSpinReason"
              placeholder="Spin reason, if needed"
              className="px-3 py-2 xl:col-span-2"
            />
            <button className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-zinc-950 hover:bg-amber-200 xl:col-span-2">
              Track Action
            </button>
          </form>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          {columns.map((column) => {
            const items = activeActions.filter(
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
                      <div className="mt-3">
                        <WikiRenderer content={action.action} />
                      </div>
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
                        <button className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10">
                          Add Update
                        </button>
                      </form>

                      <details className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                        <summary className="font-bold text-zinc-100">
                          Edit full action
                        </summary>
                        <form
                          action={updateLoreActionAction.bind(null, action.id)}
                          className="mt-4 grid gap-3 xl:grid-cols-2"
                        >
                          <select
                            name="nationId"
                            defaultValue={action.nation.id}
                            required
                            className="px-3 py-2 text-sm"
                          >
                            {nations.map((nation) => (
                              <option key={nation.id} value={nation.id}>
                                {nation.name}
                              </option>
                            ))}
                          </select>
                          <input
                            name="type"
                            required
                            defaultValue={action.type}
                            className="px-3 py-2 text-sm"
                          />
                          <input
                            name="timeframe"
                            required
                            defaultValue={action.timeframe}
                            className="px-3 py-2 text-sm"
                          />
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
                          </select>
                          <input
                            name="source"
                            defaultValue={action.source ?? ""}
                            placeholder="Source"
                            className="px-3 py-2 text-sm xl:col-span-2"
                          />
                          <textarea
                            name="action"
                            required
                            defaultValue={action.action}
                            className="min-h-32 p-3 text-sm xl:col-span-2"
                          />
                          <input
                            name="requiresSpinReason"
                            defaultValue={action.requiresSpinReason ?? ""}
                            placeholder="Spin reason"
                            className="px-3 py-2 text-sm xl:col-span-2"
                          />
                          <button className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800 xl:col-span-2">
                            Save Full Action
                          </button>
                        </form>
                      </details>

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

                      <details className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-900/8 p-3">
                        <summary className="font-bold text-emerald-100">
                          Complete with outcome and stat effects
                        </summary>
                        <form
                          action={completeLoreActionAction.bind(null, action.id)}
                          className="mt-4 grid gap-3"
                        >
                          <textarea
                            name="outcome"
                            required
                            minLength={10}
                            placeholder="Outcome. Explain what happened in canon and why the action is complete."
                            className="min-h-28 p-3 text-sm"
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              name="area"
                              defaultValue={action.nation.area ?? ""}
                              placeholder="Area, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="people"
                              defaultValue={action.nation.people}
                              placeholder="Population, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="gdp"
                              defaultValue={action.nation.gdp}
                              placeholder="GDP, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="hdi"
                              defaultValue={action.nation.hdi ?? ""}
                              placeholder="HDI, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="economy"
                              defaultValue={action.nation.economy}
                              placeholder="Economy, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="military"
                              defaultValue={action.nation.military}
                              placeholder="Military, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="government"
                              defaultValue={action.nation.government}
                              placeholder="Government, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="geoPoliticalStatus"
                              defaultValue={action.nation.geoPoliticalStatus ?? ""}
                              placeholder="Geo-political status, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="block"
                              defaultValue={action.nation.block ?? ""}
                              placeholder="Block, if changed"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              name="culture"
                              defaultValue={action.nation.culture ?? ""}
                              placeholder="Culture, if changed"
                              className="px-3 py-2 text-sm"
                            />
                          </div>
                          <p className="text-xs leading-5 text-zinc-500">
                            Leave a stat exactly as-is if the outcome does not
                            change it. Changed stats are saved with an audit
                            revision automatically.
                          </p>
                          <button className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800">
                            Complete Action
                          </button>
                        </form>
                      </details>

                      {action.updates.length ? (
                        <div className="mt-4 grid gap-2">
                          {action.updates.map((update) => (
                            <div
                              key={update.id}
                              className="rounded-md border border-white/10 bg-black/20 p-3"
                            >
                              <WikiRenderer content={update.content} />
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

        <Panel>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="neutral">Archive</Badge>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">
                Completed Actions
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Finished actions stay here for review without cluttering the
                active tracker.
              </p>
            </div>
            <Badge>{completedActions.length}</Badge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {completedActions.map((action) => (
              <article
                key={action.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{action.nation.name}</Badge>
                  <Badge tone="accent">{action.type}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  Completed: {action.updatedAt.toLocaleString("en-GB")}
                </p>
                <div className="mt-3 line-clamp-3">
                  <WikiRenderer content={action.action} />
                </div>
                {action.outcome ? (
                  <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-900/10 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-100">
                      Outcome
                    </p>
                    <div className="mt-2">
                      <WikiRenderer content={action.outcome} />
                    </div>
                  </div>
                ) : null}
                <form
                  action={updateLoreActionStatusAction.bind(null, action.id)}
                  className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"
                >
                  <select
                    name="status"
                    defaultValue={LoreActionStatus.CURRENT}
                    className="px-3 py-2 text-sm"
                  >
                    <option value={LoreActionStatus.CURRENT}>Current</option>
                    <option value={LoreActionStatus.REQUIRES_SPIN}>
                      Requires spin
                    </option>
                  </select>
                  <input
                    type="hidden"
                    name="requiresSpinReason"
                    value={action.requiresSpinReason ?? ""}
                  />
                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                    Restore
                  </button>
                </form>
              </article>
            ))}
            {completedActions.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No completed actions have been archived yet.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </ControlLayout>
  );
}
