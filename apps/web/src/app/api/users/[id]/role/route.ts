import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/permissions";

function highestRole(roles: Role[]) {
  const rank: Record<Role, number> = {
    USER: 0,
    LEADER: 1,
    JOURNALIST: 2,
    LORE: 3,
    ADMIN: 4,
    OWNER: 5,
  };

  return roles.reduce(
    (primary, role) => (rank[role] > rank[primary] ? role : primary),
    Role.USER,
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole([Role.ADMIN, Role.OWNER]);
    const { id } = await params;
    const body = (await request.json()) as { role?: Role; roles?: Role[] };
    const roles = body.roles ?? (body.role ? [body.role] : []);
    if (roles.length === 0) {
      return Response.json({ error: "roles are required" }, { status: 400 });
    }

    const user = await getPrisma().user.update({
      where: { id },
      data: { role: highestRole(roles), roles },
      select: {
        id: true,
        name: true,
        email: true,
        discordId: true,
        role: true,
        roles: true,
      },
    });

    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
