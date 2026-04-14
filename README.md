# Nation Wheel

Nation Wheel is a fictional world platform for a Discord community, using still Season 1 map images as reference material. This scaffold includes a Next.js web app, a Discord bot, shared TypeScript types, PostgreSQL via Prisma, Auth.js/NextAuth scaffolding, role-based API guards, and seed data for the canonical Season 1 nation list.

## Structure

```txt
apps/
  web/        Next.js app, API routes, Prisma schema, seed data
  bot/        discord.js bot scaffold using the web API
packages/
  shared/     Shared roles, permissions, nation stat types
```

## Requirements

- Node.js 20.9+
- pnpm 9+
- PostgreSQL database
- Discord application token for the bot

## Setup

1. Install dependencies:

```bash
pnpm install
```

On Windows PowerShell, if script execution blocks the `pnpm` shim, use `pnpm.cmd` for the same commands.

2. Create `apps/web/.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nation_wheel?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NATION_WHEEL_BOT_API_KEY="dev-bot-key"
```

3. Create `apps/bot/.env`:

```bash
DISCORD_TOKEN="replace-with-bot-token"
DISCORD_CLIENT_ID="replace-with-client-id"
DISCORD_PUBLIC_KEY="replace-with-application-public-key"
NATION_WHEEL_API_URL="http://localhost:3000/api"
NATION_WHEEL_BOT_API_KEY="dev-bot-key"
```

4. Generate Prisma client and sync the database:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

5. Start the web app:

```bash
pnpm dev:web
```

6. Start the bot in another terminal:

```bash
pnpm dev:bot
```

## Free Hosting

The simplest free hosting path for this project is:

- Web app: Vercel Hobby plan
- PostgreSQL: Neon Free plan, or another free Postgres host

Vercel needs these environment variables for the web project:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NATION_WHEEL_BOT_API_KEY="same-key-as-bot-env"
```

After deployment, update `apps/bot/.env` locally:

```bash
NATION_WHEEL_API_URL="https://your-vercel-domain.vercel.app/api"
NATION_WHEEL_WEB_URL="https://your-vercel-domain.vercel.app"
```

Then re-register and restart the bot:

```bash
pnpm --filter @nation-wheel/bot register
pnpm dev:bot
```

For the Discord embedded Activity version of `/nationwheel`, configure the public HTTPS web URL in the Discord Developer Portal after the Vercel deployment is live.

## 24/7 Bot Hosting

The Discord bot cannot stay online from this laptop while the laptop is off. Keep the web app/API on Vercel, then run `@nation-wheel/bot` as a persistent Node.js worker on a host that supports long-running processes, such as Railway or a Render Background Worker.

Use these commands for a hosted bot worker:

```bash
pnpm install --frozen-lockfile
pnpm --filter @nation-wheel/bot register
pnpm start:bot
```

Set these environment variables on the worker host:

```bash
DISCORD_TOKEN="replace-with-bot-token"
DISCORD_CLIENT_ID="replace-with-client-id"
DISCORD_PUBLIC_KEY="replace-with-application-public-key"
DISCORD_GUILD_ID=""
NATION_WHEEL_API_URL="https://your-vercel-domain.vercel.app/api"
NATION_WHEEL_WEB_URL="https://your-vercel-domain.vercel.app"
NATION_WHEEL_BOT_API_KEY="same-key-as-vercel-env"
```

Do not host the Discord gateway bot as a Vercel Function. The bot keeps a persistent Discord Gateway connection, while Vercel Functions are request-scoped serverless functions. Use Vercel for the website/API and a worker service for the always-on bot process.

## Discord Lore Team Access

Members with the Discord lore team role can access LoreCP when they sign in with Discord. The web app checks the user's linked Discord account against the configured server role and treats matching members as `LORE` for web permissions.

Set these variables on the web deployment:

```bash
DISCORD_GUILD_ID="your-discord-server-id"
DISCORD_LORE_ROLE_ID="your-lore-team-role-id"
DISCORD_ADMIN_USER_IDS="comma-separated-discord-user-ids"
NATION_WHEEL_DISCORD_BOT_TOKEN="bot-token-that-can-read-guild-members"
```

`DISCORD_LORE_ROLE_IDS` can be used instead of `DISCORD_LORE_ROLE_ID` for a comma-separated list of role IDs. The bot must be in the Discord server and able to read guild members.

## Seed Users

The seed script creates:

- `admin@nationwheel.local` with role `ADMIN`
- `lore@nationwheel.local` with role `LORE`
- `primis.leader@nationwheel.local` with role `LEADER`

All seeded users use password `nationwheel-dev`. Replace this before using any shared environment.

## Role Model

- `LEADER`: view own nation and edit own nation wiki/lore.
- `LORE`: view all nations, edit stats, edit/moderate all wiki content, access LoreCP.
- `ADMIN`: full control, including nation lifecycle, user roles, map assets, and AdminCP.

Server route handlers enforce permissions. UI checks are present for navigation and layout, but are not treated as the source of truth.

Discord bot commands are read-only profile and wiki lookup commands. Nation creation, removal, stat edits, user roles, and wiki editing are handled in the web app.

## Data Rule

Persisted nation stats in Prisma and write API request shapes are limited to `name`, `slug`, `people`, `government`, `gdp`, `economy`, and `military`, plus optional leader and flag fields. The canon source and local dev editor may also carry Season 1 reference fields such as `area`, `geoPoliticalStatus`, `block`, `culture`, `hdi`, `statNotes`, and `actions`; those fields are used for public profile context and wiki templates, not as the database write contract.

## Remaining Work

- Add Discord OAuth account linking for production leader permissions.
- Add a simple map asset management surface in AdminCP if the Season 1 image needs to be replaced from the UI.
- Add integration tests for API authorization paths.
- Connect the sponsor page to the community's chosen funding platform.
- Add bot-side links back to web profiles once the public deployment URL is known.
