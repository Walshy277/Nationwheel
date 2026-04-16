import { notFound } from "next/navigation";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import {
  addLoreActionUpdateAction,
  createLoreActionAction,
  updateLoreActionStatusAction,
  updateNationStatsAction,
  updateWikiAction,
} from "@/app/actions";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { FlagUploadField } from "@/components/nation/flag-upload-field";
import { Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";
import { LoreActionStatus, Role } from "@prisma/client";

const links = [
  { href: "/lorecp", label: "Nation Review" },
  { href: "/lorecp/actions", label: "Action Tracker" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
];

export default async function LoreNationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const { id } = await params;
  const [nation, leaders] = await Promise.all([
    getPrisma().nation.findUnique({
      where: { id },
      include: {
        wiki: true,
        loreActions: {
          orderBy: { updatedAt: "desc" },
          include: {
            updates: {
              orderBy: { createdAt: "desc" },
              take: 3,
              include: {
                createdByUser: { select: { name: true, email: true } },
              },
            },
          },
        },
        leaderUser: { select: { id: true, name: true, email: true } },
      },
    }),
    getPrisma().user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!nation) notFound();

  return (
    <ControlLayout title="LoreCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">
            Nation ID {id}
          </div>
          <h1 className="mt-3 text-3xl font-black text-white">{nation.name}</h1>
          <p className="mt-3 text-slate-300">
            Review canon stats, linked controller account, and wiki content before publishing
            changes.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-zinc-50">Action Tracking</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Use this for canon TikTok actions, completion estimates, daily
            progress updates, and spin requirements.
          </p>
          <form
            action={createLoreActionAction}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="nationId" value={nation.id} />
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
              className="px-3 py-2"
            />
            <textarea
              name="action"
              required
              placeholder="Paste the canon action"
              className="min-h-28 p-3 md:col-span-2"
            />
            <input
              name="requiresSpinReason"
              placeholder="Spin reason, if needed"
              className="px-3 py-2 md:col-span-2"
            />
            <button className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-zinc-950 hover:bg-amber-200 md:col-span-2">
              Track Action
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {nation.loreActions.map((action) => (
              <article
                key={action.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold uppercase text-zinc-200">
                    {action.status.replace("_", " ")}
                  </span>
                  <span className="rounded-md border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-200">
                    {action.type}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  Timeframe: {action.timeframe}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {action.action}
                </p>
                {action.requiresSpinReason ? (
                  <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                    Spin needed: {action.requiresSpinReason}
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
                  action={updateLoreActionStatusAction.bind(null, action.id)}
                  className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                >
                  <select
                    name="status"
                    defaultValue={action.status}
                    className="px-3 py-2 text-sm"
                  >
                    <option value={LoreActionStatus.CURRENT}>Current</option>
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
                    Update
                  </button>
                </form>
              </article>
            ))}
            {nation.loreActions.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No canon actions are tracked for this nation yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-white">Structured Stats</h2>
          <form
            action={updateNationStatsAction.bind(null, nation.id)}
            encType="multipart/form-data"
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input
              name="name"
              required
              defaultValue={nation.name}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input type="hidden" name="slug" value={nation.slug} />
            <input type="hidden" name="returnPath" value={`/lorecp/nations/${nation.id}`} />
            <input
              name="people"
              required
              defaultValue={nation.people}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="government"
              required
              defaultValue={nation.government}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="gdp"
              required
              defaultValue={nation.gdp}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="economy"
              required
              defaultValue={nation.economy}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="military"
              required
              defaultValue={nation.military}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <select
              name="leaderUserId"
              defaultValue={nation.leaderUserId ?? ""}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">No controller linked</option>
              {leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name ?? leader.email ?? leader.id}
                </option>
              ))}
            </select>
            <FlagUploadField
              currentImage={nation.flagImage}
              nationName={nation.name}
              className="grid gap-2 text-sm text-slate-300"
            />
            <button className="rounded-lg bg-yellow-300 px-4 py-2 font-bold text-slate-950 md:col-span-2">
              Save Stats
            </button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-white">Wiki Content</h2>
          <form
            action={updateWikiAction.bind(null, nation.id)}
            className="mt-5 grid gap-4"
          >
            <textarea
              name="content"
              required
              defaultValue={
                nation.wiki?.content ?? createNationWikiTemplate(nation)
              }
              className="min-h-[420px] rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100 outline-none focus:border-yellow-300"
            />
            <button className="rounded-lg border border-yellow-300/70 px-4 py-2 font-bold text-yellow-100">
              Save Wiki
            </button>
          </form>
        </Panel>
      </div>
    </ControlLayout>
  );
}
