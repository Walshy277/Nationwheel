import type { NationStats } from "./index";
import {
  formatMoney,
  formatNumber,
  getGdpTotal,
  getGdpPerCapita,
  parseArea,
  parseCompactNumber,
  parseMilitaryScore,
} from "./metrics";

function sentence(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function createNationOverview(nation: NationStats) {
  if (nation.overview?.trim()) return nation.overview.trim();

  const gdpPerCapita = getGdpPerCapita(nation);
  const population = parseCompactNumber(nation.people);
  const area = parseArea(nation.area);
  const gdp = getGdpTotal(nation);
  const military = parseMilitaryScore(nation.military);
  const government = nation.government.toLowerCase();
  const economy = nation.economy.toLowerCase();

  const scale =
    population !== null && population >= 500_000_000
      ? "a population giant"
      : population !== null && population <= 5_000_000
        ? "a compact state"
        : "a mid-scale power";
  const landShape =
    area !== null && area >= 1_000_000
      ? "vast territory"
      : area !== null && area <= 50_000
        ? "tight geography"
        : area !== null
          ? "a balanced territorial footprint"
          : "unclear territorial records";
  const prosperity =
    gdpPerCapita !== null && gdpPerCapita >= 40_000
      ? "high-value institutions and a wealthy core economy"
      : gdpPerCapita !== null && gdpPerCapita <= 5_000
        ? "harder development tradeoffs and pressure to turn resources into stability"
        : gdpPerCapita !== null
          ? "a mixed development profile with room for regional imbalance"
          : "an economy whose true output is still difficult to pin down";
  const forcePosture =
    military !== null && military >= 8
      ? "Its military makes it a state other powers have to plan around."
      : military !== null && military <= 2
        ? "Its security depends more on geography, diplomacy, or internal resilience than raw force."
        : military !== null
          ? "Its armed forces give it options without making it untouchable."
          : `Its military record is listed as ${nation.military.toLowerCase()}.`;
  const economicContext =
    gdpPerCapita !== null
      ? `with estimated output near ${formatMoney(gdpPerCapita)} per person`
      : "with incomplete per-person output records";
  return sentence([
    `${nation.name} reads as ${scale}: a ${government} with ${nation.people} people and ${landShape}.`,
    nation.area
      ? `Its territory covers ${nation.area}, giving its population and government a clear geographic frame.`
      : null,
    `The economy leans on ${economy}, ${economicContext}; that suggests ${prosperity}.`,
    gdp !== null ? `Total output is tracked near ${formatMoney(gdp)}.` : null,
    forcePosture,
    nation.geoPoliticalStatus
      ? `Diplomatically it sits in the ${nation.geoPoliticalStatus.toLowerCase()} category, which shapes how neighbours read its intentions.`
      : null,
    nation.block
      ? `Its ${nation.block} alignment gives the profile a clear bloc identity.`
      : null,
    nation.hdi
      ? `An HDI of ${nation.hdi} hints at the strength of everyday institutions behind the headline stats.`
      : null,
    nation.culture
      ? `Its culture is tied to ${nation.culture.toLowerCase()}, giving writers a distinct social texture to build from.`
      : null,
    nation.statNotes?.length
      ? `Current stat context: ${nation.statNotes[0]}`
      : null,
    nation.actions?.length
      ? `Its recent direction is shaped by ${nation.actions.length} recorded national actions.`
      : null,
  ]);
}
