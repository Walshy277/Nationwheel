import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/permissions";
import { roleUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole([Role.ADMIN]);
    const { id } = await params;
    const payload = roleUpdateSchema.parse(await request.json());
    const user = await getPrisma().user.update({
      where: { id },
      data: { role: payload.role },
      select: {
        id: true,
        email: true,
        discordId: true,
        role: true,
        nationId: true,
      },
    });

    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
