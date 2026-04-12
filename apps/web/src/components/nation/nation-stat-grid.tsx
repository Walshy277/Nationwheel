import {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getGdpTotal,
  getPopulationDensity,
  type NationStats,
} from "@nation-wheel/shared";
import { MetricCard } from "@/components/ui/shell";

export function NationStatGrid({ nation }: { nation: NationStats }) {
  const gdpTotal = getGdpTotal(nation);
  const gdpPerCapita = getGdpPerCapita(nation);
  const populationDensity = getPopulationDensity(nation);
  const usesBobakoin = nation.economy.toLowerCase().includes("bobakoin");
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
        value={formatMoney(gdpTotal)}
        unit={`Canon entry: ${nation.gdp}. Bare currency values convert at 1 global currency = $1B.`}
        info="Dollar-prefixed values are treated as direct nominal USD. Bare canon currency values use the global currency conversion rate of 1 currency = $1B. K, M, B, and T mean thousand, million, billion, and trillion."
        iconSrc="/assets/currency.png"
        iconAlt="Global currency"
      />
      <MetricCard
        label="Economy"
        value={nation.economy}
        iconSrc={usesBobakoin ? "/assets/bobakoin_crypto.png" : undefined}
        iconAlt={usesBobakoin ? "Bobakoin crypto coin" : undefined}
      />
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
