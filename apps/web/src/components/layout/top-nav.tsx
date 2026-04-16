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

export async function TopNav() {
  const user = await getCurrentUser();
  const userRoles = user
    ? Array.from(new Set([user.role, ...(user.roles ?? [])]))
    : [];
  const controlLinks = [
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
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
      controlLinks={controlLinks}
    />
  );
}
