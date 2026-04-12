import {
  canonNations,
  createNationOverview,
  createNationWikiTemplate,
  type NationStats,
  type NationSummary,
} from "@nation-wheel/shared";

export const mockNations: NationSummary[] = canonNations.map((nation) => ({
  ...nation,
  id: `canon-${nation.slug}`,
  leaderName: nation.slug === "primis" ? "Primis Leader" : null,
  summary: createNationOverview(nation),
}));

export function getMockNationBySlug(slug: string) {
  return mockNations.find((nation) => nation.slug === slug) ?? null;
}

export function getMockWiki(nation: NationStats) {
  const canonNation = canonNations.find(
    (candidate) => candidate.slug === nation.slug,
  );
  return createNationWikiTemplate(canonNation ?? nation);
}
