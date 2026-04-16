export { canonNations, type CanonNation } from "./canon-nations";
export { createNationOverview } from "./profile-copy";
export { governmentAliasEntries, normalizeGovernment } from "./governments";
export {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getGdpTotal,
  getMetricValue,
  getMilitarySizeLabel,
  getPopulationDensity,
  parseArea,
  parseCompactNumber,
  parseMilitaryScore,
  rankNations,
  rankOverallNations,
  type LeaderboardKey,
  type MetricValue,
  type RankedNation,
} from "./metrics";

export const roles = [
  "USER",
  "LEADER",
  "JOURNALIST",
  "LORE",
  "ADMIN",
  "OWNER",
] as const;
export type Role = (typeof roles)[number];

export const revisionFieldTypes = ["STATS", "WIKI"] as const;
export type RevisionFieldType = (typeof revisionFieldTypes)[number];

export type NationStats = {
  name: string;
  slug: string;
  people: string;
  government: string;
  gdp: string;
  economy: string;
  military: string;
  overview?: string | null;
  leaderName?: string | null;
  flagImage?: string | null;
  area?: string | null;
  geoPoliticalStatus?: string | null;
  block?: string | null;
  culture?: string | null;
  hdi?: string | null;
  statNotes?: string[];
  actions?: NationAction[];
};

export type NationAction = {
  nation: string;
  type: string;
  action: string;
};

export type TrackedLoreAction = {
  id: string;
  type: string;
  action: string;
  source?: string | null;
  timeframe: string;
  status: "CURRENT" | "COMPLETED" | "REQUIRES_SPIN";
  requiresSpinReason?: string | null;
  rygaaNotifiedAt?: string | null;
  updates: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
};

export type NationSummary = NationStats & {
  id: string;
  leaderName: string | null;
  summary: string;
  trackedActions?: TrackedLoreAction[];
};

export function createNationWikiTemplate(
  nation: NationStats & { spin?: string; area?: string | null },
) {
  const referenceLines = [
    nation.spin ? `- Spin: ${nation.spin}` : null,
    nation.area ? `- Area: ${nation.area}` : null,
    `- Population: ${nation.people}`,
    `- Government: ${nation.government}`,
    `- GDP: ${nation.gdp}`,
    `- Economy: ${nation.economy}`,
    `- Military: ${nation.military}`,
    nation.flagImage ? "- Flag: Uploaded" : null,
    nation.geoPoliticalStatus
      ? `- Geo-political Status: ${nation.geoPoliticalStatus}`
      : null,
    nation.block ? `- Block: ${nation.block}` : null,
    nation.culture ? `- Culture: ${nation.culture}` : null,
    nation.hdi ? `- HDI: ${nation.hdi}` : null,
    nation.statNotes?.length
      ? `- Stat Notes: ${nation.statNotes.join(" | ")}`
      : null,
  ].filter(Boolean);
  const actionLines = nation.actions?.length
    ? nation.actions
        .map(
          (entry, index) =>
            `### Action ${index + 1}: ${entry.type}\n\nNation: ${entry.nation}\n\n${entry.action}`,
        )
        .join("\n\n")
    : "Add approved TikTok action comments here using Nation, Action Type, and Action.";

  return `# ${nation.name}

${nation.name} is ready for player-authored lore. Use this profile to record the nation history, culture, diplomacy, internal factions, conflicts, treaties, and current world context.

## Canon Reference

${referenceLines.join("\n")}

## Overview

Summarize the nation's identity, founding idea, major institutions, and current direction.

## Government and Society

Describe leadership, succession, laws, public life, major regions, social groups, and political tensions.

## Economy and Infrastructure

Explain how the economy works, what the country exports or depends on, and which industries or routes matter most.

## Military and Security

Record doctrine, alliances, command structure, security services, strategic weaknesses, and notable deployments.

## Diplomacy

Track allies, rivals, treaties, active disputes, blocs, and recent negotiations. Keep blocs and geopolitical status here instead of structured stats.

## History

Add founding events, wars, crises, reforms, dynasties, revolutions, disasters, and turning points.

## Current Notes

${nation.statNotes?.length ? nation.statNotes.map((note) => `- ${note}`).join("\n") : "- Add active story hooks, unresolved claims, and player-facing context."}
- Move short-term updates into this section before folding them into history.
- Keep fixed profile stats in structured fields; keep changing lore here.

## Action History

${actionLines}`;
}

export function canAccessControlPanel(
  role: Role,
  panel: "LORECP" | "ADMINCP" | "NEWSCP",
) {
  if (panel === "ADMINCP") return role === "ADMIN" || role === "OWNER";
  if (panel === "NEWSCP") {
    return (
      role === "JOURNALIST" ||
      role === "LORE" ||
      role === "ADMIN" ||
      role === "OWNER"
    );
  }
  return role === "LORE" || role === "ADMIN" || role === "OWNER";
}

export function canEditStats(role: Role) {
  return role === "LORE" || role === "ADMIN" || role === "OWNER";
}

export function canManageNations(role: Role) {
  return role === "ADMIN" || role === "OWNER";
}

export function canManageUsers(role: Role) {
  return role === "ADMIN" || role === "OWNER";
}

export function canEditWikiForNation(params: {
  role: Role;
  userNationId: string | null;
  nationId: string;
}) {
  if (
    params.role === "ADMIN" ||
    params.role === "OWNER" ||
    params.role === "LORE"
  ) {
    return true;
  }
  return params.userNationId === params.nationId;
}

export const sampleNations: NationStats[] = [
  {
    name: "Primis",
    slug: "primis",
    people: "25M",
    government: "Colony - Military Govt",
    gdp: "Unknown",
    economy: "Tech & Oil",
    military: "Large 5 / 11",
  },
  {
    name: "Melandia",
    slug: "melandia",
    people: "750M",
    government: "Monarchy",
    gdp: "Unknown",
    economy: "Geothermal / Gems",
    military: "Air Superpower 7 / 11",
  },
  {
    name: "Isma",
    slug: "isma",
    people: "1M",
    government: "Fallen Empire",
    gdp: "Unknown",
    economy: "Finance / Gems",
    military: "None 0 / 11",
  },
];
