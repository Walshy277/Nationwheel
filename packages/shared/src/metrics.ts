import type { NationStats } from "./index";

export type MetricValue = {
  value: number | null;
  label: string;
};

export type RankedNation = {
  nation: NationStats;
  rank: number;
  value: number | null;
  label: string;
};

export type LeaderboardKey =
  | "gdp"
  | "military"
  | "area"
  | "population"
  | "hdi"
  | "overall";

const suffixMultipliers: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
  t: 1_000_000_000_000,
};

export function parseCompactNumber(input: string | undefined) {
  if (!input) return null;
  const normalized = input
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .replace(/\$/g, "");
  const match = normalized.match(/(-?\d+(?:\.\d+)?)([kmbt])?/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  const suffix = match[2]?.toLowerCase();
  return value * (suffix ? suffixMultipliers[suffix] : 1);
}

export function parseArea(input: string | undefined) {
  if (!input) return null;
  const match = input
    .replace(/,/g, ".")
    .match(/(\d+(?:[ .]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(/\s/g, ""));
  return Number.isFinite(value) ? value : null;
}

export function parseMilitaryScore(input: string | undefined) {
  if (!input) return null;

  const fraction = input.match(/(\d+(?:\.\d+)?)\s*\/\s*11/);
  if (fraction) return Number(fraction[1]);

  const value = input.toLowerCase();
  if (value.includes("world")) return 11;
  if (value.includes("expansionist")) return 10;
  if (value.includes("continental")) return 9;
  if (value.includes("regional")) return 8;
  if (value.includes("superpower") || value.includes("alliances")) return 7;
  if (value.includes("advanced")) return 6;
  if (value.includes("large")) return 5;
  if (value.includes("medium")) return 4;
  if (value.includes("standard")) return 3;
  if (value.includes("small")) return 2;
  if (value.includes("no army") || value.includes("none")) return 0;

  return null;
}

export function getGdpTotal(nation: NationStats) {
  const gdp = parseCompactNumber(nation.gdp);
  return gdp;
}

export function getGdpPerCapita(nation: NationStats) {
  const population = parseCompactNumber(nation.people);
  const gdp = parseCompactNumber(nation.gdp);
  if (!gdp) return null;
  if (!population) return null;
  return gdp / population;
}

export function getPopulationDensity(nation: NationStats) {
  const population = parseCompactNumber(nation.people);
  const area = parseArea(nation.area);
  if (!population || !area) return null;
  return population / area;
}

export function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unknown";

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  });

  if (value >= 1_000_000_000_000)
    return `$${formatter.format(value / 1_000_000_000_000)}T`;
  if (value >= 1_000_000_000)
    return `$${formatter.format(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `$${formatter.format(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${formatter.format(value / 1_000)}K`;
  return `$${formatter.format(value)}`;
}

export function formatNumber(value: number | null, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "Unknown";
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  });
  return `${formatter.format(value)}${suffix}`;
}

export function getMetricValue(
  nation: NationStats,
  key: Exclude<LeaderboardKey, "overall">,
): MetricValue {
  if (key === "gdp") {
    const value = getGdpTotal(nation);
    return { value, label: formatMoney(value) };
  }

  if (key === "military") {
    const value = parseMilitaryScore(nation.military);
    return {
      value,
      label: value === null ? nation.military : `${formatNumber(value)} / 11`,
    };
  }

  if (key === "area") {
    const value = parseArea(nation.area);
    return {
      value,
      label: value === null ? "Unknown" : `${formatNumber(value)} km2`,
    };
  }

  if (key === "population") {
    const value = parseCompactNumber(nation.people);
    return {
      value,
      label: value === null ? nation.people : formatNumber(value),
    };
  }

  const value = nation.hdi ? Number(nation.hdi) : null;
  return {
    value: Number.isFinite(value) ? value : null,
    label: Number.isFinite(value) ? value!.toFixed(2) : "Unknown",
  };
}

export function rankNations(
  nations: NationStats[],
  key: Exclude<LeaderboardKey, "overall">,
): RankedNation[] {
  return nations
    .map((nation) => {
      const metric = getMetricValue(nation, key);
      return { nation, rank: 0, value: metric.value, label: metric.label };
    })
    .filter((entry) => entry.value !== null)
    .sort((left, right) => right.value! - left.value!)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function rankOverallNations(nations: NationStats[]): RankedNation[] {
  const keys: Array<Exclude<LeaderboardKey, "overall">> = [
    "gdp",
    "military",
    "area",
    "population",
    "hdi",
  ];
  const perMetric = new Map(
    keys.map((key) => [key, rankNations(nations, key)]),
  );

  return nations
    .map((nation) => {
      const ranks = keys
        .map(
          (key) =>
            perMetric
              .get(key)
              ?.find((entry) => entry.nation.slug === nation.slug)?.rank,
        )
        .filter((rank): rank is number => typeof rank === "number");

      if (ranks.length === 0) {
        return { nation, rank: 0, value: null, label: "Unknown" };
      }

      const averageRank =
        ranks.reduce((total, rank) => total + rank, 0) / ranks.length;
      return {
        nation,
        rank: 0,
        value: averageRank,
        label: `Average rank ${averageRank.toFixed(1)}`,
      };
    })
    .filter((entry) => entry.value !== null)
    .sort((left, right) => left.value! - right.value!)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
