import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";
import type { NationStats } from "@nation-wheel/shared";

function canonApiNation(nation: NationStats & { slug: string }) {
  return {
    ...nation,
    id: `canon-${nation.slug}`,
    leaderUser: null,
    leaderName: null,
  };
}

function mergeDbAndCanonNations<T extends { name: string; slug: string }>(
  dbNations: T[],
) {
  const dbSlugs = new Set(dbNations.map((nation) => nation.slug));
  return [
    ...dbNations,
    ...canonNations
      .filter((nation) => !dbSlugs.has(nation.slug))
      .map(canonApiNation),
  ].sort((first, second) => first.name.localeCompare(second.name));
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({
      nations: canonNations.map(canonApiNation),
    });
  }

  try {
    const [{ getPrisma }, { withCanonMetadata }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/nations"),
    ]);
    const nations = await getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      include: {
        leaderUser: { select: { id: true, name: true, email: true } },
      },
    });

    return Response.json({
      nations: mergeDbAndCanonNations(
        nations.map((nation) =>
          withCanonMetadata({ ...nation, leaderName: nation.leaderName ?? null }),
        ),
      ),
    });
  } catch {
    return Response.json({
      nations: canonNations.map(canonApiNation),
    });
  }
}

export async function POST(request: Request) {
  try {
    const [{ Role }, { getPrisma }, { requireRoleOrBot }, { nationStatsSchema }] =
      await Promise.all([
        import("@prisma/client"),
        import("@/lib/prisma"),
        import("@/lib/permissions"),
        import("@/lib/validation"),
      ]);
    const user = await requireRoleOrBot(request, [Role.ADMIN, Role.OWNER]);
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
    const { jsonError } = await import("@/lib/permissions");
    return jsonError(error);
  }
}
