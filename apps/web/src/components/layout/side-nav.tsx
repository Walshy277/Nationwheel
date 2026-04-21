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
} from "@/lib/site-directory";
import { SideNavClient } from "./side-nav-client";

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
  const groups = [
    { title: "World", links: worldLinks },
    ...publicDirectoryGroups.slice(1).map((group) => ({
      title: group.title,
      links: group.links,
    })),
    ...playerGroups.map((group) => ({
      title: group.title,
      links: myNationLink ? [...group.links, myNationLink] : group.links,
    })),
    ...staffGroups.map((group) => ({ title: group.title, links: group.links })),
  ];

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[112px] h-[calc(100vh-112px)] overflow-y-auto border-r border-white/10 bg-[#080907]/72 px-3 py-5 backdrop-blur-xl">
        <SideNavClient counts={counts} groups={groups} />
        {!user ? (
          <section className="mt-6 rounded-lg border border-emerald-300/20 bg-emerald-900/8 p-3">
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
      </div>
    </aside>
  );
}
