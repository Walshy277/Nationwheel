import Link from "next/link";
import { canAccessControlPanel, type Role } from "@nation-wheel/shared";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import {
  dashboardDirectoryGroups,
  primaryNavLinks,
  publicDirectoryGroups,
  staffDirectoryGroups,
  type SiteDirectoryGroup,
  type SiteDirectoryLink,
} from "@/lib/site-directory";

type NavBadgeCounts = {
  mail: number;
  notifications: number;
};

function hasPanelAccess(roles: Role[], panel: "LORECP" | "ADMINCP" | "NEWSCP") {
  return roles.some((role) => canAccessControlPanel(role, panel));
}

async function getMyNationLink(userId: string | undefined) {
  if (!userId || !hasDatabase()) return null;

  const nation = await getPrisma().nation.findFirst({
    where: { leaderUserId: userId },
    orderBy: { name: "asc" },
    select: { slug: true },
  });

  return nation
    ? {
        href: `/nations/${nation.slug}`,
        label: "My Public Profile",
        detail: "Open your nation profile.",
      }
    : null;
}

async function getUnreadCounts(userId: string | undefined): Promise<NavBadgeCounts> {
  if (!userId || !hasDatabase()) return { mail: 0, notifications: 0 };

  const prisma = getPrisma();
  const [mail, notifications] = await prisma.$transaction([
    prisma.nationMessage.count({
      where: { toNation: { leaderUserId: userId }, readAt: null },
    }),
    prisma.leaderNotification.count({
      where: { nation: { leaderUserId: userId }, readAt: null },
    }),
  ]);

  return { mail, notifications };
}

function badgeForLink(href: string, counts: NavBadgeCounts) {
  if (href === "/dashboard/inbox") return counts.mail;
  if (href === "/dashboard/notifications") return counts.notifications;
  return 0;
}

function filterStaffGroups(groups: SiteDirectoryGroup[], roles: Role[]) {
  return groups
    .map((group) => {
      const links = group.links.filter((link) => {
        if (link.href.startsWith("/admincp")) {
          return hasPanelAccess(roles, "ADMINCP");
        }
        if (link.href.startsWith("/newscp")) {
          return hasPanelAccess(roles, "NEWSCP");
        }
        if (link.href.startsWith("/lorecp")) {
          return hasPanelAccess(roles, "LORECP");
        }
        return false;
      });

      return { ...group, links };
    })
    .filter((group) => group.links.length > 0);
}

function SideNavLink({
  link,
  badgeCount = 0,
}: {
  link: SiteDirectoryLink;
  badgeCount?: number;
}) {
  const badgeLabel = badgeCount > 99 ? "99+" : badgeCount.toString();

  return (
    <Link
      href={link.href}
      className="group grid gap-1 rounded-lg border border-transparent px-3 py-2 hover:border-emerald-300/35 hover:bg-white/[0.04]"
    >
      <span className="flex items-center justify-between gap-2 text-sm font-bold text-zinc-100 group-hover:text-emerald-100">
        <span>{link.label}</span>
        {badgeCount ? (
          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black leading-none text-zinc-950">
            {badgeLabel}
          </span>
        ) : null}
      </span>
      <span className="line-clamp-2 text-xs leading-5 text-zinc-500 group-hover:text-zinc-300">
        {link.detail}
      </span>
    </Link>
  );
}

function SideNavGroup({
  title,
  links,
  counts,
}: {
  title: string;
  links: SiteDirectoryLink[];
  counts: NavBadgeCounts;
}) {
  if (!links.length) return null;

  return (
    <section className="grid gap-2">
      <h2 className="px-3 text-xs font-black uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="grid gap-1">
        {links.map((link) => (
          <SideNavLink
            key={link.href}
            link={link}
            badgeCount={badgeForLink(link.href, counts)}
          />
        ))}
      </div>
    </section>
  );
}

export async function SideNav() {
  const user = await getCurrentUser();
  const roles = user
    ? Array.from(new Set([user.role, ...(user.roles ?? [])]))
    : [];
  const [myNationLink, counts] = await Promise.all([
    getMyNationLink(user?.id),
    getUnreadCounts(user?.id),
  ]);
  const playerGroups = user ? dashboardDirectoryGroups : [];
  const staffGroups = user ? filterStaffGroups(staffDirectoryGroups, roles) : [];
  const worldLinks = [
    ...primaryNavLinks,
    {
      href: "/directory",
      label: "Directory",
      detail: "Every public page, player tool, and staff panel.",
    },
  ];

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[112px] h-[calc(100vh-112px)] overflow-y-auto border-r border-white/10 bg-[#080907]/72 px-3 py-5 backdrop-blur-xl">
        <nav className="grid gap-6" aria-label="Global side navigation">
          <SideNavGroup title="World" links={worldLinks} counts={counts} />
          {publicDirectoryGroups.slice(1).map((group) => (
            <SideNavGroup
              key={group.title}
              title={group.title}
              links={group.links}
              counts={counts}
            />
          ))}
          {playerGroups.map((group) => (
            <SideNavGroup
              key={group.title}
              title={group.title}
              links={
                myNationLink ? [...group.links, myNationLink] : group.links
              }
              counts={counts}
            />
          ))}
          {staffGroups.map((group) => (
            <SideNavGroup
              key={group.title}
              title={group.title}
              links={group.links}
              counts={counts}
            />
          ))}
          {!user ? (
            <section className="rounded-lg border border-emerald-300/20 bg-emerald-900/8 p-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-emerald-100">
                Player Access
              </h2>
              <p className="mt-2 text-xs leading-5 text-zinc-300">
                Sign in for dashboard, postal service, notifications, and staff
                tools.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-emerald-900 px-3 py-2 text-sm font-black text-emerald-50 hover:bg-emerald-800"
              >
                Login
              </Link>
            </section>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
