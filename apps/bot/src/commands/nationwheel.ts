import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { activityUrl, miniAppActionRow } from "./helpers";

export const nationwheelCommand = {
  data: new SlashCommandBuilder()
    .setName("nationwheel")
    .setDescription("Open the Nation Wheel web app"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      embeds: [
        {
          title: "Nation Wheel",
          url: activityUrl(),
          description: "Open profiles, leaderboards, the map, and wiki tools.",
          color: 0x38d6b5,
        },
      ],
      components: [miniAppActionRow()],
      ephemeral: true,
    });
  },
};

export const nationwheelActivityEntryPoint = {
  name: "nationwheel",
  description: "Open the Nation Wheel web app",
  type: 4,
  handler: 2,
};
