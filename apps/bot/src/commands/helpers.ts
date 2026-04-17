import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type AutocompleteInteraction,
  type APIEmbed,
} from "discord.js";
import {
  canonNations,
  formatMoney,
  formatNumber,
  getGdpPerCapita,
  getGdpTotal,
  getMilitarySizeLabel,
  parseMilitaryScore,
} from "@nation-wheel/shared";
import { listNations, type ApiNation } from "../api-client";
import { config } from "../config";

let nationChoiceCache: ApiNation[] = canonNations.map((nation) => ({
  ...nation,
  id: `canon-${nation.slug}`,
  wiki: null,
}));

export function profileUrl(slug: string) {
  return new URL(`/nations/${slug}`, config.webUrl).toString();
}

export function wikiUrl(slug: string) {
  return new URL(`/nations/${slug}#wiki`, config.webUrl).toString();
}

export function botIndexUrl() {
  return new URL("/activity", config.webUrl).toString();
}

export function mapUrl() {
  return new URL("/map", config.webUrl).toString();
}

export function activityArchiveUrl() {
  return new URL("/activity-archive", config.webUrl).toString();
}

export function actionsUrl() {
  return new URL("/actions", config.webUrl).toString();
}

export function leaderboardsUrl() {
  return new URL("/leaderboards", config.webUrl).toString();
}

export function assetUrl(path: string) {
  return new URL(path, config.webUrl).toString();
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`;
}

export function nationActionRow(nation: Pick<ApiNation, "slug">) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Open Profile")
      .setStyle(ButtonStyle.Link)
      .setURL(profileUrl(nation.slug)),
    new ButtonBuilder()
      .setLabel("Wiki")
      .setStyle(ButtonStyle.Link)
      .setURL(wikiUrl(nation.slug)),
    new ButtonBuilder()
      .setLabel("Map")
      .setStyle(ButtonStyle.Link)
      .setURL(mapUrl()),
  );
}

export function miniAppActionRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Bot Home")
      .setStyle(ButtonStyle.Link)
      .setURL(botIndexUrl()),
    new ButtonBuilder()
      .setLabel("Profiles")
      .setStyle(ButtonStyle.Link)
      .setURL(new URL("/nations", config.webUrl).toString()),
    new ButtonBuilder()
      .setLabel("Actions")
      .setStyle(ButtonStyle.Link)
      .setURL(actionsUrl()),
    new ButtonBuilder()
      .setLabel("Leaderboards")
      .setStyle(ButtonStyle.Link)
      .setURL(leaderboardsUrl()),
    new ButtonBuilder()
      .setLabel("Map")
      .setStyle(ButtonStyle.Link)
      .setURL(mapUrl()),
  );
}

export function nationProfileEmbed(nation: ApiNation): APIEmbed {
  const gdpTotal = getGdpTotal(nation);
  const gdpPerCapita = getGdpPerCapita(nation);
  const militaryScore = parseMilitaryScore(nation.military);
  const usesBobakoin = nation.economy.toLowerCase().includes("bobakoin");
  const fields: NonNullable<APIEmbed["fields"]> = [
    { name: "People", value: nation.people, inline: true },
    {
      name: "GDP",
      value: formatMoney(gdpTotal),
      inline: true,
    },
    { name: "GDP per Capita", value: formatMoney(gdpPerCapita), inline: true },
    {
      name: "Army Size",
      value: getMilitarySizeLabel(nation.military),
      inline: true,
    },
    {
      name: "Army Ranking",
      value:
        militaryScore === null
          ? "Unknown"
          : `${formatNumber(militaryScore)} / 11`,
      inline: true,
    },
  ];

  if (nation.geoPoliticalStatus)
    fields.push({
      name: "Status",
      value: nation.geoPoliticalStatus,
      inline: true,
    });
  if (nation.block)
    fields.push({ name: "Block", value: nation.block, inline: true });
  if (nation.area)
    fields.push({ name: "Area", value: nation.area, inline: true });
  if (nation.hdi) fields.push({ name: "HDI", value: nation.hdi, inline: true });
  if (nation.statNotes?.length) {
    fields.push({
      name: "Current Status",
      value: truncateText(nation.statNotes.slice(0, 2).join("\n"), 900),
      inline: false,
    });
  }
  if (nation.actions?.length) {
    fields.push({
      name: "Recorded Actions",
      value: truncateText(
        nation.actions
          .slice(-2)
          .map((entry) => `${entry.type}: ${entry.action}`)
          .join("\n"),
        900,
      ),
      inline: false,
    });
  }

  return {
    title: nation.name,
    url: profileUrl(nation.slug),
    description: truncateText(`${nation.government}\n${nation.economy}`, 400),
    color: 0x38d6b5,
    fields,
    thumbnail: usesBobakoin
      ? { url: assetUrl("/assets/bobakoin_crypto.png") }
      : undefined,
    footer: { text: "Nation Wheel profile" },
  };
}

export async function respondWithNationChoices(
  interaction: AutocompleteInteraction,
) {
  const focused = interaction.options.getFocused().toLowerCase();
  const nations = await Promise.race([
    listNations().then((latest) => {
      nationChoiceCache = latest;
      return latest;
    }).catch(() => nationChoiceCache),
    new Promise<ApiNation[]>((resolve) => {
      setTimeout(() => resolve(nationChoiceCache), 2500);
    }),
  ]);
  const choices = nations
    .filter(
      (nation) =>
        nation.slug.includes(focused) ||
        nation.name.toLowerCase().includes(focused),
    )
    .slice(0, 25)
    .map((nation) => ({ name: nation.name, value: nation.slug }));

  await interaction.respond(choices);
}
