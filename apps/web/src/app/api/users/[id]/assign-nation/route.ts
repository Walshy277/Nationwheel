import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/permissions";
import { assignNationSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole([Role.ADMIN]);
    const { id } = await params;
    const payload = assignNationSchema.parse(await request.json());
    const prisma = getPrisma();

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.findUniqueOrThrow({ where: { id }, select: { id: true } });

      if (payload.nationId) {
        await tx.nation.findUniqueOrThrow({
          where: { id: payload.nationId },
          select: { id: true },
        });
      }

      await tx.nation.updateMany({
        where: { leaderUserId: id },
        data: { leaderUserId: null },
      });

      const updatedUser = await tx.user.update({
        where: { id },
        data: { nationId: payload.nationId },
        select: {
          id: true,
          email: true,
          discordId: true,
          role: true,
          nationId: true,
        },
      });

      if (payload.nationId) {
        await tx.nation.update({
          where: { id: payload.nationId },
          data: { leaderUserId: id },
        });
      }

      return updatedUser;
    });

    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
