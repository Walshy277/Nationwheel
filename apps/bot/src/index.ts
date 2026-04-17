import {
  Client,
  Events,
  GatewayIntentBits,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
} from "discord.js";
import { assertBotConfig, config } from "./config";
import { nationCommand } from "./commands/nation";
import { nationsCommand } from "./commands/nations";
import { nationwheelCommand } from "./commands/nationwheel";
import { profileCommand } from "./commands/profile";
import { wikiCommand } from "./commands/wiki";

assertBotConfig();

type BotCommand = {
  data: SlashCommandBuilder | { name: string };
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  componentPrefix?: string;
  component?: (interaction: ButtonInteraction) => Promise<void>;
};

const commandList: BotCommand[] = [
  nationCommand,
  profileCommand,
  wikiCommand,
  nationsCommand,
  nationwheelCommand,
];
const commands = new Map(
  commandList.map((command) => [command.data.name, command]),
);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function isExpiredInteraction(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 10062,
  );
}

async function replyToCommandFailure(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  content: string,
) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  } catch (error) {
    if (!isExpiredInteraction(error)) throw error;
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Nation Wheel bot ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      if (!isExpiredInteraction(error)) {
        console.error(error);
        try {
          await interaction.respond([]);
        } catch (respondError) {
          if (!isExpiredInteraction(respondError)) console.error(respondError);
        }
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const command = commandList.find(
      (candidate) =>
        candidate.componentPrefix &&
        interaction.customId.startsWith(candidate.componentPrefix),
    );
    if (!command?.component) return;

    try {
      await command.component(interaction);
    } catch (error) {
      console.error(error);
      await replyToCommandFailure(
        interaction,
        "Nation Wheel button failed. Try the command again.",
      );
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const content =
      error instanceof Error && error.name === "NationWheelApiError"
        ? "Nation Wheel API is not reachable. Start the web app or check NATION_WHEEL_API_URL."
        : "Nation Wheel command failed. Check bot and API logs.";
    await replyToCommandFailure(interaction, content);
  }
});

client.on(Events.Error, (error) => {
  console.error("Discord client error", error);
});

void client.login(config.token);
