import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { assignNationSchema } from "@/lib/validation";
import { jsonError, requireRole } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
    const { id } = await params;
    const payload = assignNationSchema.parse(await request.json());
    const prisma = getPrisma();

    await prisma.user.findUniqueOrThrow({ where: { id }, select: { id: true } });

    if (!payload.nationId) {
      return Response.json({ error: "nationId is required" }, { status: 400 });
    }

    await prisma.nation.findUniqueOrThrow({ where: { id: payload.nationId } });

    await prisma.nation.update({
      where: { id: payload.nationId },
      data: { leaderUserId: id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
