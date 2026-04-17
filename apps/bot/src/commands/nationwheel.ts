import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { assetUrl, botIndexUrl, miniAppActionRow } from "./helpers";

export const nationwheelCommand = {
  data: new SlashCommandBuilder()
    .setName("nationwheel")
    .setDescription("Open the Nation Wheel web app"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      embeds: [
        {
          title: "Nation Wheel",
          url: botIndexUrl(),
          description:
            "Open the Discord-friendly index for profiles, actions, rankings, and the map.",
          color: 0x38d6b5,
          thumbnail: { url: assetUrl("/assets/nationwheel_logo.jpg") },
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
