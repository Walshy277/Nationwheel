import {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getPopulationDensity,
  type NationStats,
} from "@nation-wheel/shared";
import { MetricCard } from "@/components/ui/shell";

export function NationStatGrid({ nation }: { nation: NationStats }) {
  const gdpPerCapita = getGdpPerCapita(nation);
  const populationDensity = getPopulationDensity(nation);
  const optionalStats = [
    ["GDP per Capita", formatMoney(gdpPerCapita)],
    [
      "Population per km2",
      populationDensity === null ? "Unknown" : formatNumber(populationDensity),
    ],
    ["Area", nation.area],
    ["Geo-political Status", nation.geoPoliticalStatus],
    ["Block", nation.block],
    ["Culture", nation.culture],
    ["HDI", nation.hdi],
  ] as const;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <MetricCard
        label="People"
        value={nation.people}
        unit="Population entries use compact units such as K, M, and B."
        info="K means thousands, M means millions, and B means billions of people."
      />
      <MetricCard label="Government" value={nation.government} />
      <MetricCard
        label="GDP"
        value={nation.gdp}
        unit="Total nominal GDP, normalized to dollars for rankings."
        info="Dollar-prefixed and compact values are treated as total nominal GDP. K, M, B, and T mean thousand, million, billion, and trillion."
      />
      <MetricCard label="Economy" value={nation.economy} />
      <MetricCard
        label="Military"
        value={nation.military}
        unit="Normalized to a 0-11 military score for rankings."
        info="The score is a canon power index, not a direct personnel count. Text labels such as regional, continental, superpower, and world are mapped onto the 0-11 scale."
      />
      {optionalStats.map(([label, value]) =>
        value ? (
          <MetricCard
            key={label}
            label={label}
            value={value}
            unit={label === "Area" ? "Square kilometers." : undefined}
          />
        ) : null,
      )}
    </div>
  );
}
