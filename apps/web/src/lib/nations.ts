import { getPrisma } from "@/lib/prisma";
import {
  createNationOverview,
  normalizeGovernment,
  type NationStats,
  type NationSummary,
} from "@nation-wheel/shared";

export function normalizeNation<T extends NationStats>(nation: T) {
  return {
    ...nation,
    government: normalizeGovernment(nation.government),
  };
}

export async function listNationSummaries() {
  const prisma = getPrisma();

  const nations = await prisma.nation.findMany({
    orderBy: { name: "asc" },
    include: {
      leaderUser: true,
    },
  });

  const dbNations: NationSummary[] = nations.map((nation) => {
    const normalized = normalizeNation({
      id: nation.id,
      name: nation.name,
      slug: nation.slug,
      people: nation.people,
      government: nation.government,
      gdp: nation.gdp,
      economy: nation.economy,
      military: nation.military,
      flagImage: nation.flagImage,
      leaderName: nation.leaderName ?? null,
      summary: "",
    });

    return {
      ...normalized,
      summary: createNationOverview(normalized),
    };
  });

  return dbNations;
}

export async function getNationProfile(slug: string) {
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
    return null;
  }

  const normalized = normalizeNation({
    id: nation.id,
    name: nation.name,
    slug: nation.slug,
    people: nation.people,
    government: nation.government,
    gdp: nation.gdp,
    economy: nation.economy,
    military: nation.military,
    flagImage: nation.flagImage,
    leaderName: nation.leaderName ?? null,
    summary: "",
    wiki: nation.wiki?.content ?? "",
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
    ...normalized,
    summary: createNationOverview(normalized),
  };
}

export function withCanonMetadata<T extends NationStats>(nation: T) {
  return normalizeNation(nation);
}
