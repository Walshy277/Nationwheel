import Link from "next/link";
import {
  formatMoney,
  formatNumber,
  getGdpTotal,
  parseArea,
  parseCompactNumber,
  rankNations,
  rankOverallNations,
  type NationSummary,
} from "@nation-wheel/shared";
import { LoreActionStatus, Role } from "@prisma/client";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { formatGameDate, getGameClock } from "@/lib/game-clock";
import { listNationSummaries } from "@/lib/nations";
import { getPrisma } from "@/lib/prisma";

const featuredSlots = [
  { key: "area", label: "Most Land", detail: "Land area" },
  { key: "population", label: "Highest Population", detail: "Population" },
  { key: "gdp", label: "Largest GDP", detail: "GDP" },
  { key: "military", label: "Highest Army Ranking", detail: "Army ranking" },
] as const;

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-black text-zinc-50">{value}</p>
    </div>
  );
}

function FeaturedCard({
  label,
  detail,
  nation,
  value,
  rank,
}: {
  label: string;
  detail: string;
  nation: NationSummary;
  value: string;
  rank: number;
}) {
  return (
    <Link href={`/nations/${nation.slug}`} className="group block">
      <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
        <div className="flex items-start justify-between gap-4">
          <Badge tone="accent">{label}</Badge>
          <span className="font-mono text-sm font-bold text-zinc-500">
            #{rank}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-black text-zinc-50">{nation.name}</h2>
        <p className="mt-2 text-sm text-zinc-400">{nation.government}</p>
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            {detail}
          </p>
          <p className="mt-2 text-xl font-black text-emerald-100">{value}</p>
        </div>
      </Panel>
    </Link>
  );
}

function roleSet(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return new Set<Role>(user ? [user.role, ...(user.roles ?? [])] : []);
}

function canUseAny(roles: Set<Role>, allowed: Role[]) {
  return allowed.some((role) => roles.has(role));
}

export async function LandingPage() {
  const user = await getCurrentUser();
  const [nations, gameClock] = await Promise.all([
    listNationSummaries(),
    getGameClock(),
  ]);
  const nationCount = nations.length;
  const featured = featuredSlots
    .map((slot) => {
      const [top] = rankNations(nations, slot.key);
      return top
        ? {
            ...slot,
            nation: top.nation as NationSummary,
            value: top.label,
            rank: top.rank,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const [overall] = rankOverallNations(nations);
  const overallScore =
    overall?.value !== null && overall?.value !== undefined
      ? `Average rank ${formatNumber(overall.value)}`
      : "Best all-round profile";
  const totalPopulation = nations.reduce(
    (sum, nation) => sum + (parseCompactNumber(nation.people) ?? 0),
    0,
  );
  const totalArea = nations.reduce(
    (sum, nation) => sum + (parseArea(nation.area) ?? 0),
    0,
  );
  const totalGdp = nations.reduce(
    (sum, nation) => sum + (getGdpTotal(nation) ?? 0),
    0,
  );

  const roles = roleSet(user);
  const isAdmin = canUseAny(roles, [Role.ADMIN, Role.OWNER]);
  const isLore = canUseAny(roles, [Role.LORE, Role.ADMIN, Role.OWNER]);
  const isNews = canUseAny(roles, [
    Role.JOURNALIST,
    Role.LORE,
    Role.ADMIN,
    Role.OWNER,
  ]);

  const signedInData =
    user && hasDatabase()
      ? await Promise.all([
          getPrisma().nation.findFirst({
            where: { leaderUserId: user.id },
            select: { id: true, name: true, slug: true },
          }),
          getPrisma().leaderNotification.count({
            where: { nation: { leaderUserId: user.id }, readAt: null },
          }),
          getPrisma().nationMessage.count({
            where: { toNation: { leaderUserId: user.id }, readAt: null },
          }),
          getPrisma().loreAction.count({
            where: {
              nation: { leaderUserId: user.id },
              status: { in: [LoreActionStatus.CURRENT, LoreActionStatus.REQUIRES_SPIN] },
            },
          }),
          getPrisma().loreAction.count({
            where: { status: LoreActionStatus.REQUIRES_SPIN },
          }),
          getPrisma().worldNewsPost.findMany({
            orderBy: { publishedAt: "desc" },
            take: 3,
            select: {
              id: true,
              title: true,
              summary: true,
              publishedAt: true,
            },
          }),
          getPrisma().forumThread.findMany({
            orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
            take: 3,
            select: {
              id: true,
              slug: true,
              title: true,
              category: true,
              updatedAt: true,
            },
          }),
        ])
      : null;

  const publicNews =
    !signedInData && hasDatabase()
      ? await getPrisma().worldNewsPost.findMany({
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            summary: true,
            publishedAt: true,
          },
        })
      : signedInData?.[5] ?? [];

  const publicThreads =
    !signedInData && hasDatabase()
      ? await getPrisma().forumThread.findMany({
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
          take: 3,
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            updatedAt: true,
          },
        })
      : signedInData?.[6] ?? [];

  return (
    <PageShell className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <Panel className="bg-[color:var(--panel-strong)]/90">
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{nationCount} canon nations</Badge>
            <Badge tone="warning">{formatGameDate(gameClock)}</Badge>
            {user ? <Badge>Signed in</Badge> : null}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-zinc-50 sm:text-5xl">
            {user
              ? "What matters right now in Nation Wheel"
              : "A living strategy world built around nations, canon, and community"}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            {user
              ? "Use the front page to catch up on your nation, new alerts, active canon work, and the latest movement across the world."
              : "Explore nation profiles, follow the current canon queue, read the latest reports, and step into the shared world without having to hunt through the directory first."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatPill label="Population" value={formatNumber(totalPopulation)} />
            <StatPill label="Land" value={`${formatNumber(totalArea)} km2`} />
            <StatPill label="GDP" value={formatMoney(totalGdp)} />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/dashboard/actions"
                  className="rounded-lg border border-emerald-300/70 px-5 py-3 font-bold text-emerald-100 hover:bg-emerald-900/10"
                >
                  My Actions
                </Link>
                <Link
                  href="/dashboard/inbox"
                  className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
                >
                  Postal Service
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/nations"
                  className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800"
                >
                  Explore Nations
                </Link>
                <Link
                  href="/news"
                  className="rounded-lg border border-emerald-300/70 px-5 py-3 font-bold text-emerald-100 hover:bg-emerald-900/10"
                >
                  Read News
                </Link>
                <Link
                  href="/forums"
                  className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
                >
                  Open Forums
                </Link>
              </>
            )}
          </div>
        </Panel>

        <Panel className="grid gap-4">
          {user ? (
            <>
              <Badge tone="warning">My World</Badge>
              <h2 className="text-2xl font-bold text-zinc-50">Personal Snapshot</h2>
              <div className="grid gap-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    My Nation
                  </p>
                  <p className="mt-1 text-2xl font-black text-zinc-50">
                    {signedInData?.[0]?.name ?? "Not linked"}
                  </p>
                  {signedInData?.[0] ? (
                    <Link
                      href={`/nations/${signedInData[0].slug}`}
                      className="mt-3 inline-flex text-sm font-bold text-emerald-100 hover:text-emerald-200"
                    >
                      Open public profile
                    </Link>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatPill
                    label="Unread Alerts"
                    value={String(signedInData?.[1] ?? 0)}
                  />
                  <StatPill
                    label="Unread Mail"
                    value={String(signedInData?.[2] ?? 0)}
                  />
                  <StatPill
                    label="My Active Actions"
                    value={String(signedInData?.[3] ?? 0)}
                  />
                </div>
                {(isLore || isAdmin || isNews) ? (
                  <div className="grid gap-2">
                    <p className="text-xs font-bold uppercase text-zinc-500">
                      Staff Shortcuts
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(isLore || isAdmin) ? (
                        <Link
                          href="/lorecp"
                          className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-bold text-zinc-100 hover:bg-white/5"
                        >
                          LoreCP
                        </Link>
                      ) : null}
                      {isAdmin ? (
                        <Link
                          href="/admincp"
                          className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-bold text-zinc-100 hover:bg-white/5"
                        >
                          AdminCP
                        </Link>
                      ) : null}
                      {isNews ? (
                        <Link
                          href="/newscp"
                          className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-bold text-zinc-100 hover:bg-white/5"
                        >
                          News Desk
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Badge tone="neutral">Start Here</Badge>
              <h2 className="text-2xl font-bold text-zinc-50">World Entry Points</h2>
              <div className="grid gap-3">
                {[
                  {
                    href: "/directory",
                    title: "Site Directory",
                    detail:
                      "Find public pages, player tools, and staff panels by category.",
                    badge: "Guide",
                    tone: "accent" as const,
                  },
                  {
                    href: "/actions",
                    title: "Canon Actions",
                    detail:
                      "Track active actions and check the completed archive.",
                    badge: "Tracker",
                    tone: "warning" as const,
                  },
                  {
                    href: "/login",
                    title: "Sign In",
                    detail:
                      "Open your dashboard, postal service, notifications, and staff panels.",
                    badge: "Account",
                    tone: "neutral" as const,
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg border border-white/10 bg-black/20 p-4 hover:border-emerald-300/70"
                  >
                    <Badge tone={item.tone}>{item.badge}</Badge>
                    <h3 className="mt-3 text-lg font-bold text-zinc-50">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {item.detail}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Panel>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-zinc-50">
              {user ? "Latest World Movement" : "What Is Happening Now"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              News, canon, and community activity are the homepage anchors now.
            </p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="warning">News</Badge>
              <Link href="/news" className="text-sm font-bold text-zinc-400 hover:text-emerald-100">
                View all
              </Link>
            </div>
            {publicNews.length ? (
              publicNews.map((post) => (
                <Link
                  key={post.id}
                  href="/news"
                  className="rounded-lg border border-white/10 bg-black/20 p-4 hover:border-emerald-300/70"
                >
                  <h3 className="text-lg font-bold text-zinc-50">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {post.summary}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {post.publishedAt.toLocaleString("en-GB")}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No news reports yet.</p>
            )}
          </Panel>

          <Panel className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="accent">Nations</Badge>
              <Link href="/nations" className="text-sm font-bold text-zinc-400 hover:text-emerald-100">
                Explore all
              </Link>
            </div>
            {overall ? (
              <Link
                href={`/nations/${(overall.nation as NationSummary).slug}`}
                className="rounded-lg border border-white/10 bg-black/20 p-4 hover:border-emerald-300/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <Badge tone="accent">Overall #1</Badge>
                  <span className="font-mono text-sm font-bold text-zinc-500">
                    #{overall.rank}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-zinc-50">
                  {(overall.nation as NationSummary).name}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {(overall.nation as NationSummary).government}
                </p>
                <p className="mt-4 text-sm font-bold text-emerald-100">
                  {overallScore}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-zinc-400">No nations available yet.</p>
            )}
          </Panel>

          <Panel className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="accent">Forums</Badge>
              <Link href="/forums" className="text-sm font-bold text-zinc-400 hover:text-emerald-100">
                Open boards
              </Link>
            </div>
            {publicThreads.length ? (
              publicThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forums/${thread.slug}`}
                  className="rounded-lg border border-white/10 bg-black/20 p-4 hover:border-emerald-300/70"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={thread.category === "Newsroom" ? "warning" : "neutral"}>
                      {thread.category}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-zinc-50">
                    {thread.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500">
                    {thread.updatedAt.toLocaleString("en-GB")}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No forum threads yet.</p>
            )}
          </Panel>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {featured.map((item) => (
          <FeaturedCard
            key={item.key}
            label={item.label}
            detail={item.detail}
            nation={item.nation}
            value={item.value}
            rank={item.rank}
          />
        ))}
      </section>
    </PageShell>
  );
}
