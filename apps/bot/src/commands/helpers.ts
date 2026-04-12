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
  getPopulationDensity,
} from "@nation-wheel/shared";
import type { ApiNation } from "../api-client";
import { config } from "../config";

export function profileUrl(slug: string) {
  return new URL(`/nations/${slug}`, config.webUrl).toString();
}

export function wikiUrl(slug: string) {
  return new URL(`/nations/${slug}#wiki`, config.webUrl).toString();
}

export function mapUrl() {
  return new URL("/map", config.webUrl).toString();
}

export function activityUrl() {
  return new URL("/activity", config.webUrl).toString();
}

export function assetUrl(path: string) {
  return new URL(path, config.webUrl).toString();
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
      .setLabel("Open Nation Wheel")
      .setStyle(ButtonStyle.Link)
      .setURL(activityUrl()),
    new ButtonBuilder()
      .setLabel("Profiles")
      .setStyle(ButtonStyle.Link)
      .setURL(new URL("/nations", config.webUrl).toString()),
    new ButtonBuilder()
      .setLabel("Leaderboards")
      .setStyle(ButtonStyle.Link)
      .setURL(new URL("/leaderboards", config.webUrl).toString()),
    new ButtonBuilder()
      .setLabel("Map")
      .setStyle(ButtonStyle.Link)
      .setURL(mapUrl()),
  );
}

export function nationProfileEmbed(nation: ApiNation): APIEmbed {
  const gdpTotal = getGdpTotal(nation);
  const gdpPerCapita = getGdpPerCapita(nation);
  const populationDensity = getPopulationDensity(nation);
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
      name: "Population per km2",
      value:
        populationDensity === null
          ? "Unknown"
          : formatNumber(populationDensity),
      inline: true,
    },
    { name: "Military", value: nation.military, inline: false },
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
      value: nation.statNotes.slice(0, 2).join("\n"),
      inline: false,
    });
  }
  if (nation.actions?.length) {
    fields.push({
      name: "Recorded Actions",
      value: nation.actions
        .slice(-2)
        .map((entry) => entry.type)
        .join("\n"),
      inline: false,
    });
  }

  return {
    title: nation.name,
    url: profileUrl(nation.slug),
    description: `${nation.government}\n${nation.economy}`,
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
  const choices = canonNations
    .filter(
      (nation) =>
        nation.slug.includes(focused) ||
        nation.name.toLowerCase().includes(focused),
    )
    .slice(0, 25)
    .map((nation) => ({ name: nation.name, value: nation.slug }));

  await interaction.respond(choices);
}
