import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getNationBySlug } from "../api-client";
import {
  nationActionRow,
  nationProfileEmbed,
  respondWithNationChoices,
} from "./helpers";

export const profileCommand = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a nation profile")
    .addStringOption((option) =>
      option
        .setName("nation")
        .setDescription("Nation name")
        .setAutocomplete(true)
        .setRequired(true),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondWithNationChoices(interaction);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const slug = interaction.options.getString("nation", true);
    const nation = await getNationBySlug(slug);

    await interaction.editReply({
      embeds: [nationProfileEmbed(nation)],
      components: [nationActionRow(nation)],
    });
  },
};
