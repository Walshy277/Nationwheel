import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getNationBySlug, listNations } from "../api-client";
import {
  nationActionRow,
  nationProfileEmbed,
  respondWithNationChoices,
  truncateText,
} from "./helpers";

function trimWiki(content: string) {
  return truncateText(content, 3500);
}

export const nationCommand = {
  data: new SlashCommandBuilder()
    .setName("nation")
    .setDescription("Browse Nation Wheel information")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View a nation profile summary")
        .addStringOption((option) =>
          option
            .setName("nation")
            .setDescription("Nation name")
            .setAutocomplete(true)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List the first 25 nations"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription("Open a random nation profile"),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("wiki")
        .setDescription("Nation wiki commands")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("view")
            .setDescription("View a nation wiki excerpt")
            .addStringOption((option) =>
              option
                .setName("nation")
                .setDescription("Nation name")
                .setAutocomplete(true)
                .setRequired(true),
            ),
        ),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondWithNationChoices(interaction);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (!group && subcommand === "list") {
      await interaction.deferReply();
      const nations = await listNations();
      await interaction.editReply({
        embeds: [
          {
            title: "Nation Wheel Nations",
            description: nations
              .slice(0, 25)
              .map(
                (nation, index) =>
                  `**${index + 1}. ${nation.name}** - ${nation.government}`,
              )
              .join("\n"),
            color: 0x38d6b5,
            footer: { text: "Use /profile to open a specific nation." },
          },
        ],
      });
      return;
    }

    if (!group && subcommand === "random") {
      await interaction.deferReply();
      const nations = await listNations();
      const nation = nations[Math.floor(Math.random() * nations.length)];
      if (!nation) {
        await interaction.editReply("No nations are available yet.");
        return;
      }
      await interaction.editReply({
        content: `Random nation: **${nation.name}**`,
        embeds: [nationProfileEmbed(nation)],
        components: [nationActionRow(nation)],
      });
      return;
    }

    if (!group && subcommand === "view") {
      await interaction.deferReply();
      const slug = interaction.options.getString("nation", true);
      const nation = await getNationBySlug(slug);
      await interaction.editReply({
        embeds: [nationProfileEmbed(nation)],
        components: [nationActionRow(nation)],
      });
      return;
    }

    if (group === "wiki" && subcommand === "view") {
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
    }
  },
};
