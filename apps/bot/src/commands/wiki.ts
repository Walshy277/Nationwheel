import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getNationBySlug } from "../api-client";
import {
  nationActionRow,
  respondWithNationChoices,
  truncateText,
} from "./helpers";

function trimWiki(content: string) {
  return truncateText(content, 3500);
}

export const wikiCommand = {
  data: new SlashCommandBuilder()
    .setName("wiki")
    .setDescription("Read a nation wiki excerpt")
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
      embeds: [
        {
          title: `${nation.name} Wiki`,
          description: trimWiki(
            nation.wiki?.content ?? "No wiki content has been written yet.",
          ),
          color: 0xfacc15,
          footer: { text: "Use the web app for full wiki editing." },
        },
      ],
      components: [nationActionRow(nation)],
    });
  },
};
