import Link from "next/link";
import { LoreActionStatus, Role } from "@prisma/client";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { formatGameDate, getGameClock } from "@/lib/game-clock";
import { getPrisma } from "@/lib/prisma";

type DashboardLink = {
  href: string;
  title: string;
  detail: string;
  badge?: string;
  tone?: "neutral" | "accent" | "warning";
};

const publicLinks: DashboardLink[] = [
  {
    href: "/directory",
    title: "Site Directory",
    detail: "Find public pages, player tools, and staff panels by category.",
    badge: "Guide",
    tone: "accent",
  },
  {
    href: "/nations",
    title: "Nation Directory",
    detail: "Search profiles, flags, leaders, stats, and public wiki pages.",
    badge: "Profiles",
  },
  {
    href: "/actions",
    title: "Canon Actions",
    detail: "Track active actions and check the completed archive.",
    badge: "Tracker",
    tone: "accent",
  },
  {
    href: "/news",
    title: "World News",
    detail: "Read reports, announcements, and current world updates.",
    badge: "Gazette",
    tone: "warning",
  },
  {
    href: "/map",
    title: "World Map",
    detail: "Open the Season 1 reference map.",
    badge: "Map",
  },
];

const adminLinks: DashboardLink[] = [
  {
    href: "/admincp",
    title: "AdminCP Overview",
    detail: "Jump to user, nation, log, map, announcement, and news tools.",
    badge: "Admin",
    tone: "warning",
  },
  {
    href: "/admincp/users",
    title: "Users and Roles",
    detail: "Assign roles, Discord IDs, and nation controllers.",
    badge: "Access",
  },
  {
    href: "/admincp/nations",
    title: "Nation Management",
    detail: "Create nations, edit stats, update flags, and edit any wiki.",
    badge: "Nations",
  },
  {
    href: "/admincp/logs",
    title: "Friendly Logs",
    detail: "Review readable before-and-after changes.",
    badge: "Audit",
  },
];

const loreLinks: DashboardLink[] = [
  {
    href: "/lorecp",
    title: "LoreCP Review",
    detail: "Review nations, wiki content, and lore management tools.",
    badge: "Lore",
    tone: "accent",
  },
  {
    href: "/lorecp/actions",
    title: "Action Tracker",
    detail: "Create, update, complete, and archive canon actions.",
    badge: "Actions",
  },
  {
    href: "/lorecp/actions#create-action",
    title: "Create Action",
    detail: "Jump straight to the canon action creation form.",
    badge: "Track",
    tone: "warning",
  },
  {
    href: "/lorecp/pages/lore",
    title: "World Lore",
    detail: "Edit the single merged world and setting lore page.",
    badge: "Canon",
  },
  {
    href: "/lorecp/pages/announcements",
    title: "Announcements",
    detail: "Edit the scrolling news ticker and public announcements.",
    badge: "Ticker",
    tone: "warning",
  },
];

const newsLinks: DashboardLink[] = [
  {
    href: "/newscp",
    title: "News Desk",
    detail: "Publish and edit world news reports.",
    badge: "News",
    tone: "warning",
  },
];

function roleSet(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return new Set<Role>(user ? [user.role, ...(user.roles ?? [])] : []);
}

function canUseAny(roles: Set<Role>, allowed: Role[]) {
  return allowed.some((role) => roles.has(role));
}

function LinkCard({ item }: { item: DashboardLink }) {
  return (
    <Link href={item.href} className="group block">
      <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
        <div className="flex items-start justify-between gap-3">
          <Badge tone={item.tone ?? "neutral"}>{item.badge ?? "Open"}</Badge>
          <span className="text-zinc-600 transition group-hover:text-emerald-200">
            Go
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-zinc-50">{item.title}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{item.detail}</p>
      </Panel>
    </Link>
  );
}

function Section({
  title,
  detail,
  items,
}: {
  title: string;
  detail: string;
  items: DashboardLink[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-black text-zinc-50">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          {detail}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <LinkCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const roles = roleSet(user);
  const isAdmin = canUseAny(roles, [Role.ADMIN, Role.OWNER]);
  const isLore = canUseAny(roles, [Role.LORE, Role.ADMIN, Role.OWNER]);
  const isNews = canUseAny(roles, [
    Role.JOURNALIST,
    Role.LORE,
    Role.ADMIN,
    Role.OWNER,
  ]);

  const [gameClock, myNation, counts, leaderCounts, staffActions] =
    user && hasDatabase()
      ? await Promise.all([
          getGameClock(),
          getPrisma().nation.findFirst({
            where: { leaderUserId: user.id },
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true, updatedAt: true },
          }),
          getPrisma()
            .$transaction([
              getPrisma().nation.count(),
              getPrisma().loreAction.count({
                where: { status: { not: "COMPLETED" } },
              }),
              getPrisma().worldNewsPost.count(),
              getPrisma().nationRevision.count(),
            ])
            .catch(() => null),
          getPrisma()
            .$transaction([
              getPrisma().leaderNotification.count({
                where: { nation: { leaderUserId: user.id }, readAt: null },
              }),
              getPrisma().nationMessage.count({
                where: { toNation: { leaderUserId: user.id }, readAt: null },
              }),
              getPrisma().loreAction.count({
                where: {
                  nation: { leaderUserId: user.id },
                  status: { not: LoreActionStatus.COMPLETED },
                },
              }),
            ])
            .catch(() => null),
          isLore
            ? getPrisma()
                .loreAction.findMany({
                  where: {
                    status: {
                      in: [
                        LoreActionStatus.CURRENT,
                        LoreActionStatus.REQUIRES_SPIN,
                      ],
                    },
                  },
                  orderBy: { updatedAt: "asc" },
                  take: 80,
                  include: {
                    nation: { select: { name: true } },
                    updates: {
                      orderBy: { createdAt: "desc" },
                      take: 1,
                      select: { createdAt: true },
                    },
                  },
                })
                .catch(() => [])
            : Promise.resolve([]),
        ])
      : [await getGameClock(), null, null, null, []];

  const accountLabel =
    user?.name ?? user?.email ?? user?.discordId ?? "Signed out";
  const staffLinks = [
    ...(isAdmin ? adminLinks : []),
    ...(isLore ? loreLinks : []),
    ...(isNews ? newsLinks : []),
  ];
  const uniqueStaffLinks = Array.from(
    new Map(staffLinks.map((item) => [item.href, item])).values(),
  );
  const staleCutoff = new Date();
  staleCutoff.setHours(staleCutoff.getHours() - 24);
  const staffSpinActions = staffActions.filter(
    (action) => action.status === LoreActionStatus.REQUIRES_SPIN,
  );
  const staleActions = staffActions.filter((action) => {
    const latestUpdate = action.updates[0]?.createdAt;
    const latestTouch =
      latestUpdate && latestUpdate > action.updatedAt
        ? latestUpdate
        : action.updatedAt;
    return latestTouch < staleCutoff;
  });

  if (!user) {
    return (
      <PageShell className="grid gap-6">
        <Panel>
          <Badge tone="accent">Dashboard</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Sign in to manage Nation Wheel
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            The dashboard is the central place for nation management, staff
            control panels, news, lore, and admin tools.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200"
          >
            Login
          </Link>
        </Panel>
        <Section
          title="Public Tools"
          detail="These are available without staff access."
          items={publicLinks}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="grid gap-8">
      <Panel className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div>
          <Badge tone="accent">Dashboard</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Command Center
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Signed in as <span className="font-bold">{accountLabel}</span>.
            Your roles are {(user.roles?.length ? user.roles : [user.role]).join(", ")}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/wiki"
              className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200"
            >
              Manage My Nation
            </Link>
            <Link
              href="/dashboard/actions"
              className="rounded-lg border border-emerald-300/70 px-5 py-3 font-bold text-emerald-100 hover:bg-emerald-300/10"
            >
              My Actions
            </Link>
            <Link
              href="/dashboard/inbox"
              className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
            >
              Inbox
            </Link>
            {uniqueStaffLinks.length ? (
              <a
                href="#control-panels"
                className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
              >
                Control Panels
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">
              My Nation
            </p>
            <p className="mt-1 text-2xl font-black text-zinc-50">
              {myNation?.name ?? "Not linked"}
            </p>
            {myNation ? (
              <Link
                href={`/nations/${myNation.slug}`}
                className="mt-3 inline-flex text-sm font-bold text-emerald-100 hover:text-emerald-200"
              >
                Open public profile
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Nations
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {counts?.[0] ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Active Actions
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {counts?.[1] ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Game Date
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {formatGameDate(gameClock)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Reports
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {counts?.[2] ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Logs
              </p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {counts?.[3] ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {staffSpinActions.length || staleActions.length ? (
        <Panel className="border-amber-300/35 bg-amber-300/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="warning">Staff Notifications</Badge>
              <h2 className="mt-3 text-2xl font-bold text-amber-50">
                Action attention needed
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-100">
                Lore and admin staff are notified here when an action requires
                a spin or has gone untouched for 24 hours.
              </p>
            </div>
            <Link
              href="/lorecp/actions"
              className="rounded-lg border border-amber-200/50 px-4 py-2 text-sm font-bold text-amber-50 hover:bg-amber-200/10"
            >
              Open Action Tracker
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-amber-200/20 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-amber-100">
                Spin required
              </p>
              <p className="mt-1 text-2xl font-black text-amber-50">
                {staffSpinActions.length}
              </p>
              <p className="mt-2 text-sm text-amber-100/80">
                {staffSpinActions
                  .slice(0, 3)
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
                  .slice(0, 3)
                  .map((action) => action.nation.name)
                  .join(", ") || "Clear"}
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      <Section
        title="My Tools"
        detail="Everything a signed-in leader or community member needs day to day."
        items={[
          {
            href: "/dashboard/wiki",
            title: "Manage My Nation",
            detail:
              "Update your public leader name, profile picture, and nation wiki.",
            badge: "Mine",
            tone: "accent",
          },
          {
            href: "/dashboard/actions",
            title: "My Actions",
            detail:
              "Review your active canon actions, spin calls, staff updates, and completed archive.",
            badge: leaderCounts?.[2] ? `${leaderCounts[2]} Active` : "Tracker",
            tone: "accent",
          },
          {
            href: "/dashboard/inbox",
            title: "Inbox",
            detail:
              "Read private messages, staff edits, and action notifications.",
            badge:
              (leaderCounts?.[0] ?? 0) + (leaderCounts?.[1] ?? 0)
                ? `${(leaderCounts?.[0] ?? 0) + (leaderCounts?.[1] ?? 0)} New`
                : "Inbox",
            tone:
              (leaderCounts?.[0] ?? 0) + (leaderCounts?.[1] ?? 0)
                ? "warning"
                : "neutral",
          },
          ...(myNation
            ? [
                {
                  href: `/nations/${myNation.slug}`,
                  title: "Open My Profile",
                  detail: "View your nation as everyone else sees it.",
                  badge: "Public",
                } satisfies DashboardLink,
              ]
            : []),
        ]}
      />

      <section id="control-panels">
        <Section
          title="Control Panels"
          detail="Staff tools live here first. The sidebars still exist inside each CP, but Dashboard is the main entry point."
          items={uniqueStaffLinks}
        />
      </section>

      <Section
        title="Public Tools"
        detail="Fast links for the pages players use most."
        items={publicLinks}
      />
    </PageShell>
  );
}
