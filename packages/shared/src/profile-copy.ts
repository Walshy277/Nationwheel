import type { NationStats } from "./index";
import {
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getPopulationDensity,
} from "./metrics";

function sentence(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function createNationOverview(nation: NationStats) {
  const gdpPerCapita = getGdpPerCapita(nation);
  const density = getPopulationDensity(nation);
  const economicContext =
    gdpPerCapita !== null
      ? `with estimated output near ${formatMoney(gdpPerCapita)} per person`
      : "with incomplete per-person output records";
  const densityContext =
    density !== null
      ? `a population density of about ${formatNumber(density)} people per km2`
      : null;

  return sentence([
    `${nation.name} is a ${nation.government.toLowerCase()} with a recorded population of ${nation.people}.`,
    nation.area
      ? `Its territory covers ${nation.area}${densityContext ? `, with ${densityContext}` : ""}.`
      : null,
    `The economy is centered on ${nation.economy.toLowerCase()}, ${economicContext}.`,
    `Its military profile is listed as ${nation.military.toLowerCase()}, shaping how the state protects its borders and projects influence.`,
    nation.geoPoliticalStatus
      ? `Diplomatically, it is marked as ${nation.geoPoliticalStatus.toLowerCase()}.`
      : null,
    nation.block ? `Its current bloc alignment is ${nation.block}.` : null,
    nation.hdi
      ? `The country's HDI is ${nation.hdi}, giving a useful signal for living standards and institutional capacity.`
      : null,
    nation.culture
      ? `Cultural identity is strongly associated with ${nation.culture.toLowerCase()}.`
      : null,
    nation.statNotes?.length
      ? `Current stat context: ${nation.statNotes[0]}`
      : null,
    nation.actions?.length
      ? `Its recent direction is shaped by ${nation.actions.length} recorded national actions.`
      : null,
  ]);
}
