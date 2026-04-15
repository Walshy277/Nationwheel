import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { getServerSession } from "next-auth";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const allowEmailAccountLinking =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_DANGEROUS_EMAIL_ACCOUNT_LINKING === "true";

function getDiscordBotToken() {
  return (
    process.env.NATION_WHEEL_DISCORD_BOT_TOKEN ??
    process.env.DISCORD_BOT_TOKEN ??
    process.env.DISCORD_TOKEN
  );
}

function getLoreRoleIds() {
  return (process.env.DISCORD_LORE_ROLE_ID ?? process.env.DISCORD_LORE_ROLE_IDS)
    ?.split(",")
    .map((roleId) => roleId.trim())
    .filter(Boolean);
}

function getAdminDiscordIds() {
  return process.env.DISCORD_ADMIN_USER_IDS?.split(",")
    .map((discordId) => discordId.trim())
    .filter(Boolean);
}

function getOwnerDiscordIds() {
  return process.env.DISCORD_OWNER_USER_IDS?.split(",")
    .map((discordId) => discordId.trim())
    .filter(Boolean);
}

async function getEffectiveRole(params: {
  role: Role;
  discordId: string | null;
  discordAccessToken?: string | null;
}) {
  if (params.role === Role.OWNER || params.role === Role.ADMIN) {
    return params.role;
  }

  if (params.discordId && getOwnerDiscordIds()?.includes(params.discordId)) {
    return Role.OWNER;
  }

  if (params.discordId && getAdminDiscordIds()?.includes(params.discordId)) {
    return Role.ADMIN;
  }

  if (params.role === Role.LORE) {
    return params.role;
  }

  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = getDiscordBotToken();
  const loreRoleIds = getLoreRoleIds();

  if (!params.discordId || !guildId || !loreRoleIds?.length) {
    return params.role;
  }

  try {
    if (params.discordAccessToken) {
      const response = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${params.discordAccessToken}`,
          },
          cache: "no-store",
        },
      );

      if (response.ok) {
        const member = (await response.json()) as { roles?: string[] };
        const hasLoreRole = member.roles?.some((roleId) =>
          loreRoleIds.includes(roleId),
        );

        if (hasLoreRole) return Role.LORE;
      }
    }

    if (!botToken) return params.role;

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${params.discordId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return params.role;

    const member = (await response.json()) as { roles?: string[] };
    const hasLoreRole = member.roles?.some((roleId) =>
      loreRoleIds.includes(roleId),
    );

    return hasLoreRole ? Role.LORE : params.role;
  } catch (error) {
    console.error("Unable to resolve Discord lore role membership", error);
    return params.role;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: process.env.DATABASE_URL ? PrismaAdapter(getPrisma()) : undefined,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
              params: { scope: "identify email" },
            },
            allowDangerousEmailAccountLinking: allowEmailAccountLinking,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await getPrisma().user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) return null;

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          discordId: user.discordId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      const accountDiscordId =
        account?.provider === "discord" ? account.providerAccountId : null;

      if (account?.provider === "discord" && token.sub) {
        token.discordId = accountDiscordId;
        token.discordAccessToken = account.access_token;

        if (process.env.DATABASE_URL) {
          await getPrisma().user.update({
            where: { id: token.sub },
            data: { discordId: account.providerAccountId },
          });
  } catch (error) {
    console.error("Failed to persist Discord ID on login", error);
  }
}

      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER;
        token.discordId =
          accountDiscordId ??
          (user as { discordId?: string | null }).discordId ??
          (token.discordId as string | null | undefined) ??
          null;
      }

      if (token.sub && process.env.DATABASE_URL) {
        const dbUser = await getPrisma().user.findUnique({
          where: { id: token.sub },
          select: { role: true, discordId: true },
        });

        if (dbUser) {
          token.role = await getEffectiveRole({
            role: dbUser.role,
            discordId: dbUser.discordId,
            discordAccessToken:
              (token.discordAccessToken as string | null | undefined) ?? null,
          });
          token.discordId =
            dbUser.discordId ??
            accountDiscordId ??
            (token.discordId as string | null | undefined) ??
            null;
        }
      }

      if (!process.env.DATABASE_URL && !token.discordId && token.sub) {
        token.discordId = token.sub;
      }

      token.role = await getEffectiveRole({
        role: (token.role as Role | undefined) ?? Role.USER,
        discordId: (token.discordId as string | null | undefined) ?? null,
        discordAccessToken:
          (token.discordAccessToken as string | null | undefined) ?? null,
      });

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.discordId =
          (token.discordId as string | null | undefined) ?? null;
      }

      return session;
    },
  },
};

export async function getCurrentUser() {
  if (!process.env.NEXTAUTH_SECRET) {
    return null;
  }

  try {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unable to resolve current user session", error);
    return null;
  }
}
