"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getGdpTotal,
  getPopulationDensity,
  parseArea,
  parseCompactNumber,
  parseMilitaryScore,
  type NationSummary,
} from "@nation-wheel/shared";
import { Badge, InfoTooltip, Panel } from "@/components/ui/shell";

const colors = ["#5de6bd", "#ffd764", "#9fb7ff", "#ff8a9a"] as const;

const metricRows = [
  {
    key: "people",
    label: "Population",
    unit: "people",
    info: "Compact entries use K for thousands, M for millions, and B for billions.",
    getValue: (nation: NationSummary) => nation.people,
    getComparableValue: (nation: NationSummary) => parseCompactNumber(nation.people),
  },
  {
    key: "gdp",
    label: "GDP",
    unit: "normalized dollars",
    info: "Dollar-prefixed and compact values are treated as total nominal GDP. K, M, B, and T mean thousand, million, billion, and trillion.",
    getValue: (nation: NationSummary) => formatMoney(getGdpTotal(nation)),
    getComparableValue: (nation: NationSummary) => getGdpTotal(nation),
  },
  {
    key: "gdpPerCapita",
    label: "GDP per Capita",
    unit: "dollars per person",
    info: "Derived by dividing total nominal GDP by population. Unknown means one of those inputs cannot be normalized.",
    getValue: (nation: NationSummary) => formatMoney(getGdpPerCapita(nation)),
    getComparableValue: (nation: NationSummary) => getGdpPerCapita(nation),
  },
  {
    key: "military",
    label: "Military",
    unit: "0-11 power index",
    info: "Canon military labels are normalized onto a 0-11 power index. This is not a personnel count.",
    getValue: (nation: NationSummary) => {
      const score = parseMilitaryScore(nation.military);
      return score === null ? nation.military : `${formatNumber(score)} / 11`;
    },
    getComparableValue: (nation: NationSummary) =>
      parseMilitaryScore(nation.military),
  },
  {
    key: "area",
    label: "Land Area",
    unit: "km2",
    info: "Area values are parsed as square kilometers when canon data includes an area field.",
    getValue: (nation: NationSummary) => {
      const area = parseArea(nation.area);
      return area === null ? "Unknown" : `${formatNumber(area)} km2`;
    },
    getComparableValue: (nation: NationSummary) => parseArea(nation.area),
  },
  {
    key: "density",
    label: "Population Density",
    unit: "people per km2",
    info: "Derived from population divided by land area.",
    getValue: (nation: NationSummary) => {
      const density = getPopulationDensity(nation);
      return density === null ? "Unknown" : formatNumber(density);
    },
    getComparableValue: (nation: NationSummary) => getPopulationDensity(nation),
  },
  {
    key: "hdi",
    label: "HDI",
    unit: "0-1 index",
    info: "Human Development Index where canon data provides it.",
    getValue: (nation: NationSummary) => nation.hdi ?? "Unknown",
    getComparableValue: (nation: NationSummary) => {
      const value = nation.hdi ? Number(nation.hdi) : null;
      return Number.isFinite(value) ? value : null;
    },
  },
  {
    key: "government",
    label: "Government",
    unit: "canon label",
    getValue: (nation: NationSummary) => nation.government,
  },
  {
    key: "economy",
    label: "Economy",
    unit: "canon sectors",
    getValue: (nation: NationSummary) => nation.economy,
  },
] as const;

function isBestComparableValue(
  row: (typeof metricRows)[number],
  nation: NationSummary,
  selectedNations: NationSummary[],
) {
  if (!("getComparableValue" in row)) return false;
  const value = row.getComparableValue(nation);
  if (value === null) return false;
  const values = selectedNations
    .map((selectedNation) => row.getComparableValue(selectedNation))
    .filter((item): item is number => item !== null);
  return values.length > 1 && value === Math.max(...values);
}

const radarMetrics = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "military", label: "Military" },
  { key: "area", label: "Land" },
  { key: "hdi", label: "HDI" },
] as const;

function getRadarValue(
  nation: NationSummary,
  key: (typeof radarMetrics)[number]["key"],
) {
  if (key === "population") return parseCompactNumber(nation.people);
  if (key === "military") return parseMilitaryScore(nation.military);
  if (key === "area") return parseArea(nation.area);
  if (key === "hdi") {
    const value = nation.hdi ? Number(nation.hdi) : null;
    return Number.isFinite(value) ? value : null;
  }
  return getGdpTotal(nation);
}

function getPoint(index: number, value: number, radius = 92) {
  const angle = -Math.PI / 2 + (index / radarMetrics.length) * Math.PI * 2;
  return {
    x: 120 + Math.cos(angle) * radius * value,
    y: 120 + Math.sin(angle) * radius * value,
  };
}

function RadarChart({
  nations,
  allNations,
}: {
  nations: NationSummary[];
  allNations: NationSummary[];
}) {
  const maxima = new Map(
    radarMetrics.map((metric) => [
      metric.key,
      Math.max(
        1,
        ...allNations.map((nation) => getRadarValue(nation, metric.key) ?? 0),
      ),
    ]),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] lg:items-center">
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:p-4">
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-label="Radar chart"
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              points={radarMetrics
                .map((_, index) => {
                  const point = getPoint(index, ring);
                  return `${point.x},${point.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
            />
          ))}
          {radarMetrics.map((metric, index) => {
            const point = getPoint(index, 1.04);
            return (
              <text
                key={metric.key}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#d8dfd4"
                fontSize="8"
                fontWeight="700"
              >
                {metric.label}
              </text>
            );
          })}
          {nations.map((nation, nationIndex) => {
            const points = radarMetrics
              .map((metric, index) => {
                const value = getRadarValue(nation, metric.key) ?? 0;
                const normalized = Math.min(
                  1,
                  Math.max(0, value / (maxima.get(metric.key) ?? 1)),
                );
                const point = getPoint(index, normalized);
                return `${point.x},${point.y}`;
              })
              .join(" ");
            return (
              <polygon
                key={nation.slug}
                points={points}
                fill={colors[nationIndex]}
                fillOpacity="0.14"
                stroke={colors[nationIndex]}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
      <div className="grid min-w-0 content-start gap-3">
        <h2 className="text-2xl font-bold text-zinc-50">Radar Overview</h2>
        <p className="text-sm leading-7 text-zinc-300">
          Each axis is normalized against the strongest canon nation for that
          metric, so selected nations keep a stable scale.
        </p>
        <div className="flex flex-wrap gap-2">
          {nations.map((nation, index) => (
            <span
              key={nation.slug}
              className="max-w-full rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-100"
            >
              <span
                className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span className="break-words">{nation.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NationCompare({ nations }: { nations: NationSummary[] }) {
  const defaultSlugs = nations.slice(0, 2).map((nation) => nation.slug);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(defaultSlugs);

  const selectedNations = useMemo(
    () =>
      selectedSlugs
        .map((slug) => nations.find((nation) => nation.slug === slug))
        .filter((nation): nation is NationSummary => Boolean(nation)),
    [nations, selectedSlugs],
  );

  function updateSelection(index: number, slug: string) {
    setSelectedSlugs((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? slug : item)),
    );
  }

  function addNation() {
    const next = nations.find((nation) => !selectedSlugs.includes(nation.slug));
    if (next) setSelectedSlugs((current) => [...current, next.slug]);
  }

  function removeNation(index: number) {
    setSelectedSlugs((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50">Selection</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Choose between two and four nations.
            </p>
          </div>
          <button
            type="button"
            onClick={addNation}
            disabled={selectedSlugs.length >= 4}
            className="w-full rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Add Nation
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {selectedSlugs.map((slug, index) => (
            <label key={`${slug}-${index}`} className="grid gap-2">
              <span className="flex items-center justify-between gap-2 text-sm font-semibold text-zinc-300">
                Nation {index + 1}
                {selectedSlugs.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => removeNation(index)}
                    className="rounded-md border border-red-300/60 px-2 py-1 text-xs text-red-100 hover:bg-red-300/10"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
              <select
                value={slug}
                onChange={(event) => updateSelection(index, event.target.value)}
                className="min-h-11 min-w-0 px-3"
              >
                {nations.map((nation) => (
                  <option
                    key={nation.slug}
                    value={nation.slug}
                    disabled={
                      selectedSlugs.includes(nation.slug) && nation.slug !== slug
                    }
                  >
                    {nation.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Panel>

      <Panel>
        <RadarChart nations={selectedNations} allNations={nations} />
      </Panel>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-zinc-50">
            Side-by-side Stats
          </h2>
          <Badge tone="accent">{selectedNations.length} selected</Badge>
        </div>
        <div className="grid gap-3 md:hidden">
          {metricRows.map((row) => (
            <div
              key={row.key}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-100">{row.label}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{row.unit}</p>
                </div>
                {"info" in row && row.info ? (
                  <InfoTooltip label={`${row.label} details`}>
                    {row.info}
                  </InfoTooltip>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3">
                {selectedNations.map((nation, index) => {
                  const isBest = isBestComparableValue(
                    row,
                    nation,
                    selectedNations,
                  );
                  return (
                    <div
                      key={`${row.key}-${nation.slug}`}
                      className={`grid gap-1 rounded-md border p-3 ${
                        isBest
                          ? "border-emerald-300/50 bg-emerald-300/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <Link
                        href={`/nations/${nation.slug}`}
                        className="flex min-w-0 items-center gap-2 font-bold text-zinc-50 hover:text-emerald-100"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: colors[index] }}
                        />
                        <span className="break-words">{nation.name}</span>
                      </Link>
                      <span className="break-words text-sm leading-6 text-zinc-300">
                        {isBest ? (
                          <span className="mb-1 block text-xs font-bold uppercase text-emerald-100">
                            Strongest selected
                          </span>
                        ) : null}
                        {row.key === "economy" &&
                        nation.economy.toLowerCase().includes("bobakoin") ? (
                          <Image
                            src="/assets/bobakoin_crypto.png"
                            alt="Bobakoin crypto coin"
                            width={22}
                            height={22}
                            className="mr-2 inline h-5 w-5 rounded-full object-cover"
                          />
                        ) : null}
                        {row.getValue(nation)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-black/20 md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#11140f] text-xs uppercase text-zinc-300">
              <tr className="border-b border-white/10">
                <th className="w-56 px-4 py-3">Metric</th>
                {selectedNations.map((nation) => (
                  <th key={nation.slug} className="px-4 py-3">
                    <Link
                      href={`/nations/${nation.slug}`}
                      className="text-zinc-50 hover:text-emerald-100"
                    >
                      {nation.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr key={row.key} className="border-b border-white/5">
                  <th className="px-4 py-4 font-semibold text-zinc-100">
                    <span className="flex items-center gap-2">
                      {row.label}
                      {"info" in row && row.info ? (
                        <InfoTooltip label={`${row.label} details`}>
                          {row.info}
                        </InfoTooltip>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-zinc-400">
                      {row.unit}
                    </span>
                  </th>
                  {selectedNations.map((nation) => {
                    const isBest = isBestComparableValue(
                      row,
                      nation,
                      selectedNations,
                    );
                    return (
                    <td
                      key={`${row.key}-${nation.slug}`}
                      className={`px-4 py-4 leading-6 text-zinc-200 ${
                        isBest ? "bg-emerald-300/10" : ""
                      }`}
                    >
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {isBest ? (
                          <span className="rounded-md border border-emerald-300/50 bg-emerald-300/10 px-2 py-1 text-xs font-bold uppercase text-emerald-100">
                            Best
                          </span>
                        ) : null}
                        {row.key === "economy" &&
                        nation.economy.toLowerCase().includes("bobakoin") ? (
                          <Image
                            src="/assets/bobakoin_crypto.png"
                            alt="Bobakoin crypto coin"
                            width={22}
                            height={22}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : null}
                        {row.getValue(nation)}
                      </span>
                    </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th className="px-4 py-4 font-semibold text-zinc-100">
                  Summary
                </th>
                {selectedNations.map((nation) => (
                  <td
                    key={`summary-${nation.slug}`}
                    className="px-4 py-4 leading-7 text-zinc-300"
                  >
                    {nation.summary}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
