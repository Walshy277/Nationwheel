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
  },
  {
    key: "gdp",
    label: "GDP",
    unit: "nominal USD",
    iconSrc: "/assets/currency.png",
    info: "Dollar-prefixed values are direct nominal USD. Bare canon currency values convert at 1 global currency = $1B. K, M, B, and T mean thousand, million, billion, and trillion.",
    getValue: (nation: NationSummary) => formatMoney(getGdpTotal(nation)),
  },
  {
    key: "gdpPerCapita",
    label: "GDP per Capita",
    unit: "dollars per person",
    iconSrc: "/assets/currency.png",
    info: "Derived by dividing total nominal GDP by population. Unknown means one of those inputs cannot be normalized.",
    getValue: (nation: NationSummary) => formatMoney(getGdpPerCapita(nation)),
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
  },
  {
    key: "hdi",
    label: "HDI",
    unit: "0-1 index",
    info: "Human Development Index where canon data provides it.",
    getValue: (nation: NationSummary) => nation.hdi ?? "Unknown",
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

const radarMetrics = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "military", label: "Military" },
  { key: "area", label: "Land" },
  { key: "hdi", label: "HDI" },
] as const;

function getRadarValue(nation: NationSummary, key: (typeof radarMetrics)[number]["key"]) {
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

function RadarChart({ nations }: { nations: NationSummary[] }) {
  const maxima = new Map(
    radarMetrics.map((metric) => [
      metric.key,
      Math.max(
        1,
        ...nations.map((nation) => getRadarValue(nation, metric.key) ?? 0),
      ),
    ]),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <svg viewBox="0 0 240 240" role="img" aria-label="Radar chart">
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
            const point = getPoint(index, 1.08);
            return (
              <text
                key={metric.key}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#d8dfd4"
                fontSize="9"
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
                  value / (maxima.get(metric.key) ?? 1),
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
      <div className="grid content-start gap-3">
        <h2 className="text-2xl font-bold text-zinc-50">Radar Overview</h2>
        <p className="text-sm leading-7 text-zinc-300">
          Each axis is normalized against the strongest selected nation for that
          metric, so the chart compares relative strengths within this group.
        </p>
        <div className="flex flex-wrap gap-2">
          {nations.map((nation, index) => (
            <span
              key={nation.slug}
              className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-100"
            >
              <span
                className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              {nation.name}
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
            className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="min-h-11 px-3"
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
        <RadarChart nations={selectedNations} />
      </Panel>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-zinc-50">
            Side-by-side Stats
          </h2>
          <Badge tone="accent">{selectedNations.length} selected</Badge>
        </div>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20">
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
                      {"iconSrc" in row && row.iconSrc ? (
                        <Image
                          src={row.iconSrc}
                          alt="Global currency"
                          width={18}
                          height={18}
                          className="h-4 w-4 rounded object-cover"
                        />
                      ) : null}
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
                  {selectedNations.map((nation) => (
                    <td
                      key={`${row.key}-${nation.slug}`}
                      className="px-4 py-4 leading-6 text-zinc-200"
                    >
                      <span className="inline-flex items-center gap-2">
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
                  ))}
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
