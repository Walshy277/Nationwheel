import Link from "next/link";
import { LoreActionStatus, Role } from "@prisma/client";
import { ControlSearch } from "@/components/control/control-search";
import { GameDateControl } from "@/components/control/game-date-control";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { loreCpLinks } from "@/lib/control-panels";
import { listNationSummaries } from "@/lib/nations";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

const panelLinks = [
  {
    href: "/lorecp/actions",
    title: "Action Tracker",
    detail: "Run the canon queue, spin decisions, outcomes, and daily updates.",
    cta: "Open Tracker",
    tone: "warning",
  },
  {
    href: "/lorecp/pages/wars",
    title: "Wars Page",
    detail: "Publish active wars, frozen conflicts, and peace outcomes.",
    cta: "Edit Wars",
    tone: "warning",
  },
  {
    href: "/lorecp/pages/lore",
    title: "World Lore",
    detail: "Maintain the public canon hub, timeline, and world rules.",
    cta: "Edit Lore",
    tone: "accent",
  },
  {
    href: "/lorecp/pages/announcements",
    title: "Announcements",
    detail: "Keep the public ticker current without opening the news desk.",
    cta: "Edit Ticker",
    tone: "neutral",
  },
] as const;

export default async function LoreCpPage() {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const [nations, actionStats] = await Promise.all([
    listNationSummaries(),
    getPrisma().$transaction([
      getPrisma().loreAction.count({ where: { status: LoreActionStatus.CURRENT } }),
      getPrisma().loreAction.count({
        where: { status: LoreActionStatus.REQUIRES_SPIN },
      }),
      getPrisma().loreAction.count({
        where: { status: LoreActionStatus.COMPLETED },
      }),
      getPrisma().nationRevision.count({ where: { fieldType: "WIKI" } }),
    ]),
  ]);

  return (
    <ControlLayout
      title="LoreCP"
      eyebrow="Lore"
      description="This is the staff lane for canon review, action handling, and public lore maintenance."
      links={loreCpLinks}
      stats={[
        { label: "Current Actions", value: actionStats[0] },
        { label: "Needs Spin", value: actionStats[1] },
        { label: "Completed", value: actionStats[2] },
        { label: "Wiki Revisions", value: actionStats[3] },
      ]}
    >
      <div className="grid gap-5">
        <Panel>
          <Badge tone="accent">LoreCP</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">
            Lore Control Panel
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Start with the live canon queue, then move into nation review and
            public page maintenance.
          </p>
        </Panel>

        <GameDateControl />

        <div className="grid gap-3 md:grid-cols-3">
          <Panel className="border-amber-300/25 bg-amber-300/10">
            <p className="text-xs font-bold uppercase text-amber-100">
              Spin queue
            </p>
            <p className="mt-1 text-3xl font-black text-amber-50">
              {actionStats[1]}
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              These actions are blocked pending a wheel result or tie-break.
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Nation review queue
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {nations.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Nations currently available for canon moderation and stats review.
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Completed canon actions
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {actionStats[2]}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Archived items already pushed through the completion workflow.
            </p>
          </Panel>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {panelLinks.map((item) => (
            <Panel key={item.href} className="grid gap-3">
              <Badge tone={item.tone}>{item.title}</Badge>
              <p className="text-sm leading-6 text-zinc-300">{item.detail}</p>
              <Link
                href={item.href}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
              >
                {item.cta}
              </Link>
            </Panel>
          ))}
        </div>

        <ControlSearch
          targetId="lore-nation-review-list"
          label="Search nations"
          placeholder="Search by nation, government, leader, economy, or military"
        />

        <div id="lore-nation-review-list" className="grid gap-4">
          {nations.map((nation) => (
            <Panel
              key={nation.id}
              data-control-search-item
              data-search={`${nation.name} ${nation.government} ${nation.leaderName ?? ""} ${nation.economy} ${nation.military}`}
              className="grid gap-3 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{nation.name}</h2>
                  <Badge>{nation.government}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Review stats, wiki content, flags, and canon revision history.
                </p>
              </div>
              <Link
                href={`/lorecp/nations/${nation.id}`}
                className="self-center rounded-lg border border-yellow-300/60 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10"
              >
                Review Nation
              </Link>
            </Panel>
          ))}
        </div>
      </div>
    </ControlLayout>
  );
}
