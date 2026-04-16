import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/permissions";

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.OWNER]);
    const users = await getPrisma().user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        discordId: true,
        role: true,
        roles: true,
        leaderOf: { select: { id: true, name: true, slug: true } },
      },
    });

    return Response.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}
