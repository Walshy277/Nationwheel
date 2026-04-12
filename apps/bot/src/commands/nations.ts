import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { ApiNation } from "../api-client";
import { listNations } from "../api-client";
import { config } from "../config";
import { miniAppActionRow } from "./helpers";

const pageSize = 12;

function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(page, 0), Math.max(pageCount - 1, 0));
}

function nationsEmbed(nations: ApiNation[], page: number) {
  const pageCount = Math.ceil(nations.length / pageSize);
  const safePage = clampPage(page, pageCount);
  const start = safePage * pageSize;
  const pageNations = nations.slice(start, start + pageSize);

  return {
    title: "Nation Wheel Nations",
    description: pageNations
      .map(
        (nation, index) =>
          `**${start + index + 1}. ${nation.name}**\n${nation.government} - ${nation.people} people - ${nation.military}`,
      )
      .join("\n\n"),
    color: 0x38d6b5,
    footer: {
      text: `Page ${safePage + 1} of ${pageCount}. Use /profile to open a nation.`,
    },
  };
}

function nationsControls(page: number, total: number) {
  const pageCount = Math.ceil(total / pageSize);
  const safePage = clampPage(page, pageCount);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`nations:${safePage - 1}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage === 0),
    new ButtonBuilder()
      .setCustomId(`nations:${safePage + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= pageCount - 1),
    new ButtonBuilder()
      .setLabel("Open Directory")
      .setStyle(ButtonStyle.Link)
      .setURL(new URL("/nations", config.webUrl).toString()),
  );
}

export const nationsCommand = {
  data: new SlashCommandBuilder()
    .setName("nations")
    .setDescription("List Nation Wheel nations"),
  componentPrefix: "nations:",

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const nations = await listNations();

    await interaction.editReply({
      embeds: [nationsEmbed(nations, 0)],
      components: [nationsControls(0, nations.length), miniAppActionRow()],
    });
  },

  async component(interaction: ButtonInteraction) {
    const [, pageValue] = interaction.customId.split(":");
    const page = Number(pageValue);
    const nations = await listNations();
    const safePage = Number.isFinite(page) ? page : 0;

    await interaction.update({
      embeds: [nationsEmbed(nations, safePage)],
      components: [
        nationsControls(safePage, nations.length),
        miniAppActionRow(),
      ],
    });
  },
};
