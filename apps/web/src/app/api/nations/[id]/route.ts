import { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { withCanonMetadata } from "@/lib/nations";
import { jsonError, requireRoleOrBot } from "@/lib/permissions";
import { nationStatsSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const nation = await getPrisma().nation.findUnique({
      where: { id },
      include: {
        leaderUser: { select: { id: true, name: true, email: true } },
        wiki: true,
      },
    });

    if (!nation)
      return Response.json({ error: "Nation not found" }, { status: 404 });
    return Response.json({ nation: withCanonMetadata(nation) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRoleOrBot(request, [Role.LORE, Role.ADMIN]);
    const { id } = await params;
    const payload = nationStatsSchema
      .partial()
      .strict()
      .parse(await request.json());
    const current = await getPrisma().nation.findUniqueOrThrow({
      where: { id },
    });

    const nation = await getPrisma().nation.update({
      where: { id },
      data: {
        ...payload,
        leaderUserId:
          payload.leaderUserId === undefined ? undefined : payload.leaderUserId,
        revisions: {
          create: {
            fieldType: "STATS",
            previousValue: {
              name: current.name,
              slug: current.slug,
              people: current.people,
              government: current.government,
              gdp: current.gdp,
              economy: current.economy,
              military: current.military,
            },
            newValue: payload,
            changedByUserId: user.id ?? undefined,
          },
        },
      },
    });

    return Response.json({ nation });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoleOrBot(request, [Role.ADMIN]);
    const { id } = await params;
    await getPrisma().nation.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
