import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole([Role.ADMIN, Role.OWNER]);
    const { id } = await params;
    const body = (await request.json()) as { role?: Role };
    if (!body.role) {
      return Response.json({ error: "role is required" }, { status: 400 });
    }

    const user = await getPrisma().user.update({
      where: { id },
      data: { role: body.role },
      select: {
        id: true,
        name: true,
        email: true,
        discordId: true,
        role: true,
      },
    });

    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
