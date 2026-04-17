import { REST, Routes } from "discord.js";
import { assertBotConfig, config } from "./config";
import { nationCommand } from "./commands/nation";
import { nationsCommand } from "./commands/nations";
import { nationwheelCommand } from "./commands/nationwheel";
import { profileCommand } from "./commands/profile";
import { trackActionCommand } from "./commands/trackaction";
import { wikiCommand } from "./commands/wiki";

assertBotConfig();

const rest = new REST({ version: "10" }).setToken(config.token!);
const slashCommands = [
  nationCommand.data.toJSON(),
  profileCommand.data.toJSON(),
  wikiCommand.data.toJSON(),
  nationsCommand.data.toJSON(),
  nationwheelCommand.data.toJSON(),
  trackActionCommand.data.toJSON(),
];
const globalCommands: unknown[] = [];

if (config.guildId) {
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId!, config.guildId),
      { body: slashCommands },
    );
    console.log("Registered guild slash commands.");
    await rest.put(Routes.applicationCommands(config.clientId!), {
      body: globalCommands,
    });
    console.log("Cleared global commands.");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 50001
    ) {
      throw new Error(
        `Discord refused guild command registration for guild ${config.guildId}. Invite the bot to that server with both bot and applications.commands scopes, or verify DISCORD_GUILD_ID is the server ID.`,
      );
    }

    throw error;
  }
} else {
  await rest.put(Routes.applicationCommands(config.clientId!), {
    body: [...slashCommands, ...globalCommands],
  });
  console.log("Registered global slash commands.");
}
