import { Role } from "@prisma/client";
import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";
import { getPrisma } from "@/lib/prisma";
import { withCanonMetadata } from "@/lib/nations";
import { jsonError, requireRoleOrBot } from "@/lib/permissions";
import { nationStatsSchema } from "@/lib/validation";

export async function GET() {
  try {
    const nations = await getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      include: {
        leaderUser: { select: { id: true, name: true, email: true } },
      },
    });

    return Response.json({
      nations: nations.map((nation) => withCanonMetadata(nation)),
    });
  } catch {
    return Response.json({
      nations: canonNations.map((nation) => ({
        ...nation,
        id: `canon-${nation.slug}`,
        leaderUser: null,
      })),
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRoleOrBot(request, [Role.ADMIN]);
    const payload = nationStatsSchema.parse(await request.json());
    const nation = await getPrisma().nation.create({
      data: {
        ...payload,
        leaderUserId: payload.leaderUserId ?? undefined,
        wiki: {
          create: {
            content: createNationWikiTemplate(payload),
            updatedByUserId: user.id,
          },
        },
        revisions: {
          create: {
            fieldType: "STATS",
            previousValue: {},
            newValue: payload,
            changedByUserId: user.id ?? undefined,
          },
        },
      },
    });

    return Response.json({ nation }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
