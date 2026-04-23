import {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getGdpTotal,
  getMilitarySizeLabel,
  parseMilitaryScore,
  type NationStats,
} from "@nation-wheel/shared";
import { MetricCard } from "@/components/ui/shell";

export function NationStatGrid({ nation }: { nation: NationStats }) {
  const gdpTotal = getGdpTotal(nation);
  const gdpPerCapita = getGdpPerCapita(nation);
  const militaryScore = parseMilitaryScore(nation.military);
  const usesBobakoin = nation.economy.toLowerCase().includes("bobakoin");
  const optionalStats = [
    ["GDP per Capita", formatMoney(gdpPerCapita)],
    ["Area", nation.area],
    ["Geo-political Status", nation.geoPoliticalStatus],
    ["Block", nation.block],
    ["Culture", nation.culture],
    ["HDI", nation.hdi],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
        unit="Total nominal GDP, normalized to dollars for rankings."
        info="Dollar-prefixed and compact values are treated as total nominal GDP. K, M, B, and T mean thousand, million, billion, and trillion."
      />
      <MetricCard
        label="Economy"
        value={nation.economy}
        iconSrc={usesBobakoin ? "/assets/bobakoin_crypto.png" : undefined}
        iconAlt={usesBobakoin ? "Bobakoin crypto coin" : undefined}
      />
      <MetricCard
        label="Army Size"
        value={getMilitarySizeLabel(nation.military)}
        unit="Canon army-size or force-posture label."
      />
      <MetricCard
        label="Army Ranking"
        value={
          militaryScore === null ? "Unknown" : `${formatNumber(militaryScore)} / 11`
        }
        unit="Normalized 0-11 ranking score."
        info="This is a canon power index used for rankings, separate from the army-size label."
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
