import { getPrisma } from "@/lib/prisma";
import { getMockNationBySlug, getMockWiki, mockNations } from "@/lib/mock-data";
import {
  canonNations,
  createNationOverview,
  normalizeGovernment,
  type NationStats,
  type NationSummary,
} from "@nation-wheel/shared";

export function withCanonMetadata<T extends NationStats>(nation: T) {
  const canon = canonNations.find(
    (candidate) => candidate.slug === nation.slug,
  );
  const source = canon ?? nation;

  return {
    ...nation,
    ...canon,
    government: normalizeGovernment(source.government),
  };
}

export async function listNationSummaries() {
  try {
    const prisma = getPrisma();
    const nations = await prisma.nation.findMany({
      orderBy: { name: "asc" },
      include: {
        leaderUser: true,
      },
    });

    const dbNations: NationSummary[] = nations.map((nation) => {
      const enriched = withCanonMetadata({
        id: nation.id,
        name: nation.name,
        slug: nation.slug,
        people: nation.people,
        government: nation.government,
        gdp: nation.gdp,
        economy: nation.economy,
        military: nation.military,
        flagImage: nation.flagImage,
        leaderName: nation.leaderUser?.name ?? null,
        summary: "",
      });

      return {
        ...enriched,
        summary: createNationOverview(enriched),
      };
    });

    const dbBySlug = new Map(dbNations.map((nation) => [nation.slug, nation]));
    return mockNations.map(
      (canonNation) => dbBySlug.get(canonNation.slug) ?? canonNation,
    );
  } catch {
    return mockNations;
  }
}

export async function getNationProfile(slug: string) {
  try {
    const prisma = getPrisma();
    const nation = await prisma.nation.findUnique({
      where: { slug },
      include: {
        leaderUser: true,
        wiki: true,
        loreActions: {
          orderBy: { updatedAt: "desc" },
          include: {
            updates: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true, content: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!nation) {
      const mockNation = getMockNationBySlug(slug);
      return mockNation
        ? { ...mockNation, wiki: getMockWiki(mockNation) }
        : null;
    }

    const enriched = withCanonMetadata({
      id: nation.id,
      name: nation.name,
      slug: nation.slug,
      people: nation.people,
      government: nation.government,
      gdp: nation.gdp,
      economy: nation.economy,
      military: nation.military,
      flagImage: nation.flagImage,
      leaderName: nation.leaderUser?.name ?? null,
      summary: "",
      wiki: nation.wiki?.content ?? getMockWiki(nation),
      trackedActions: nation.loreActions.map((action) => ({
        id: action.id,
        type: action.type,
        action: action.action,
        source: action.source,
        timeframe: action.timeframe,
        status: action.status,
        requiresSpinReason: action.requiresSpinReason,
        rygaaNotifiedAt: action.rygaaNotifiedAt?.toISOString() ?? null,
        updates: action.updates.map((update) => ({
          id: update.id,
          content: update.content,
          createdAt: update.createdAt.toISOString(),
        })),
      })),
    });

    return {
      ...enriched,
      summary: createNationOverview(enriched),
    };
  } catch {
    const nation = getMockNationBySlug(slug);
    return nation ? { ...nation, wiki: getMockWiki(nation) } : null;
  }
}
