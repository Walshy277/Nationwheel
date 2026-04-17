import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createTrackedAction } from "../api-client";
import { config } from "../config";
import {
  actionsUrl,
  profileUrl,
  respondWithNationChoices,
  truncateText,
} from "./helpers";

function memberHasConfiguredStaffRole(interaction: ChatInputCommandInteraction) {
  if (!config.staffRoleIds.length) {
    return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
  }

  const memberRoles = interaction.member?.roles;
  if (!memberRoles) return false;
  if (Array.isArray(memberRoles)) {
    return config.staffRoleIds.some((roleId) => memberRoles.includes(roleId));
  }

  return config.staffRoleIds.some((roleId) => memberRoles.cache.has(roleId));
}

export const trackActionCommand = {
  data: new SlashCommandBuilder()
    .setName("trackaction")
    .setDescription("Create a Nation Wheel canon action tracker entry")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("nation")
        .setDescription("Nation receiving the action")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Action type, such as Military, Diplomacy, Economy")
        .setRequired(true)
        .setMaxLength(80),
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Action text to track")
        .setRequired(true)
        .setMaxLength(1800),
    )
    .addStringOption((option) =>
      option
        .setName("timeframe")
        .setDescription("Approximate completion timeframe")
        .setRequired(true)
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("source")
        .setDescription("TikTok source or staff note")
        .setRequired(false)
        .setMaxLength(240),
    )
    .addStringOption((option) =>
      option
        .setName("spin_reason")
        .setDescription("Fill this if the action requires a spin")
        .setRequired(false)
        .setMaxLength(240),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondWithNationChoices(interaction);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    if (!memberHasConfiguredStaffRole(interaction)) {
      await interaction.reply({
        content:
          "Only Nation Wheel staff can track canon actions from Discord.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const nationSlug = interaction.options.getString("nation", true);
    const type = interaction.options.getString("type", true);
    const actionText = interaction.options.getString("action", true);
    const timeframe = interaction.options.getString("timeframe", true);
    const source = interaction.options.getString("source");
    const requiresSpinReason = interaction.options.getString("spin_reason");

    const action = await createTrackedAction({
      nationSlug,
      type,
      action: actionText,
      timeframe,
      source,
      requiresSpinReason,
    });

    await interaction.editReply({
      embeds: [
        {
          title: "Action tracked",
          url: actionsUrl(),
          description: truncateText(action.action, 900),
          color:
            action.status === "REQUIRES_SPIN" ? 0xfacc15 : 0x38d6b5,
          fields: [
            {
              name: "Nation",
              value: action.nation
                ? `[${action.nation.name}](${profileUrl(action.nation.slug)})`
                : nationSlug,
              inline: true,
            },
            { name: "Type", value: action.type, inline: true },
            { name: "Timeframe", value: action.timeframe, inline: true },
            {
              name: "Status",
              value: action.status.replace("_", " "),
              inline: true,
            },
            ...(action.requiresSpinReason
              ? [
                  {
                    name: "Spin reason",
                    value: action.requiresSpinReason,
                    inline: false,
                  },
                ]
              : []),
          ],
          footer: { text: "Created in Nation Wheel Action Tracker" },
        },
      ],
    });
  },
};
