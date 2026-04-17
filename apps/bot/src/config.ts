import "dotenv/config";

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  apiUrl: process.env.NATION_WHEEL_API_URL ?? "http://localhost:3000/api",
  webUrl: process.env.NATION_WHEEL_WEB_URL ?? "http://localhost:3000",
  botApiKey: process.env.NATION_WHEEL_BOT_API_KEY,
  staffRoleIds: (process.env.NATION_WHEEL_STAFF_ROLE_IDS ?? "")
    .split(",")
    .map((roleId) => roleId.trim())
    .filter(Boolean),
};

export function assertBotConfig() {
  const missing = Object.entries(config)
    .filter(([key, value]) => ["token", "clientId"].includes(key) && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing bot config: ${missing.join(", ")}`);
  }
}
