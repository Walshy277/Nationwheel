import { canAccessControlPanel, type Role } from "@nation-wheel/shared";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { TopNavMenu } from "./top-nav-menu";

function hasPanelAccess(roles: Role[], panel: "LORECP" | "ADMINCP" | "NEWSCP") {
  return roles.some((role) => canAccessControlPanel(role, panel));
}

async function getMyNationHref(userId: string | undefined) {
  if (!userId || !hasDatabase()) return null;

  const nation = await getPrisma().nation.findFirst({
    where: { leaderUserId: userId },
    orderBy: { name: "asc" },
    select: { slug: true },
  });

  return nation ? `/nations/${nation.slug}` : null;
}

async function getNavUnreadCounts(userId: string | undefined) {
  if (!userId || !hasDatabase()) {
    return { mail: 0, notifications: 0 };
  }

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

export async function TopNav() {
  const user = await getCurrentUser();
  const userRoles = user
    ? Array.from(new Set([user.role, ...(user.roles ?? [])]))
    : [];
  const controlLinks = [
    ...(hasPanelAccess(userRoles, "LORECP")
      ? [{ href: "/lorecp", label: "LoreCP" }]
      : []),
    ...(hasPanelAccess(userRoles, "NEWSCP")
      ? [{ href: "/newscp", label: "NewsCP" }]
      : []),
    ...(hasPanelAccess(userRoles, "ADMINCP")
      ? [{ href: "/admincp", label: "AdminCP" }]
      : []),
  ];

  return (
    <TopNavMenu
      userLabel={user?.role ?? null}
      myNationHref={await getMyNationHref(user?.id)}
      unreadCounts={await getNavUnreadCounts(user?.id)}
      controlLinks={controlLinks}
    />
  );
}
