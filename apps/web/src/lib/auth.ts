import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function cleanEnv(value: string | undefined) {
  return value?.replace(/(?:\\r|\\n|\r|\n)+$/g, "").trim();
}

const discordClientId = cleanEnv(process.env.DISCORD_CLIENT_ID);
const discordClientSecret = cleanEnv(process.env.DISCORD_CLIENT_SECRET);
const discordGuildId = cleanEnv(process.env.DISCORD_GUILD_ID);
const discordBotToken = cleanEnv(process.env.NATION_WHEEL_DISCORD_BOT_TOKEN);
const nextAuthSecret = cleanEnv(process.env.NEXTAUTH_SECRET);
const discordAdminUserIds = parseCsvEnv(process.env.DISCORD_ADMIN_USER_IDS);
const discordLoreRoleIds = [
  ...parseCsvEnv(process.env.DISCORD_LORE_ROLE_ID),
  ...parseCsvEnv(process.env.DISCORD_LORE_ROLE_IDS),
];

const allowEmailAccountLinking =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_DANGEROUS_EMAIL_ACCOUNT_LINKING === "true";

type DiscordProfile = {
  id?: string;
  username?: string;
  global_name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

type DiscordGuildMember = {
  roles?: string[];
};

function parseCsvEnv(value: string | undefined) {
  return (
    cleanEnv(value)
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []
  );
}

function highestRole(left: Role, right: Role) {
  const rank: Record<Role, number> = {
    USER: 0,
    LEADER: 1,
    LORE: 2,
    ADMIN: 3,
    OWNER: 4,
  };

  return rank[right] > rank[left] ? right : left;
}

function getPrimaryRole(roles: Role[]) {
  return roles.reduce((primary, role) => highestRole(primary, role), Role.USER);
}

function mergeRoles(...roleGroups: Array<Role[] | Role | null | undefined>) {
  const roles = new Set<Role>();

  for (const group of roleGroups) {
    if (!group) continue;
    const values = Array.isArray(group) ? group : [group];
    for (const role of values) roles.add(role);
  }

  if (roles.size === 0) roles.add(Role.USER);
  return Array.from(roles);
}

async function getDiscordMemberRole(discordId: string) {
  if (discordAdminUserIds.includes(discordId)) {
    return Role.ADMIN;
  }

  if (!discordGuildId || !discordBotToken || discordLoreRoleIds.length === 0) {
    return Role.USER;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${discordGuildId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      },
    );

    if (response.status === 404) {
      return Role.USER;
    }

    if (!response.ok) {
      console.error("Unable to resolve Discord guild member role", {
        status: response.status,
        discordId,
      });
      return Role.USER;
    }

    const member = (await response.json()) as DiscordGuildMember;
    const memberRoles = new Set(member.roles ?? []);
    return discordLoreRoleIds.some((roleId) => memberRoles.has(roleId))
      ? Role.LORE
      : Role.USER;
  } catch (error) {
    console.error("Unable to fetch Discord guild member role", error);
    return Role.USER;
  }
}

async function resolveDiscordUser(profile: DiscordProfile) {
  if (!profile.id) return null;

  const prisma = getPrisma();
  const email = profile.email?.toLowerCase() ?? null;
  const displayName = profile.global_name ?? profile.username ?? null;
  const discordRole = await getDiscordMemberRole(profile.id);

  const existingByDiscord = await prisma.user.findUnique({
    where: { discordId: profile.id },
  });

  if (existingByDiscord) {
    const roles = mergeRoles(existingByDiscord.roles, existingByDiscord.role, discordRole);
    const role = getPrimaryRole(roles);
    if (
      existingByDiscord.role !== role ||
      existingByDiscord.roles.length !== roles.length ||
      !roles.every((candidate) => existingByDiscord.roles.includes(candidate)) ||
      (!existingByDiscord.name && displayName) ||
      (!existingByDiscord.image && profile.avatar)
    ) {
      return prisma.user.update({
        where: { id: existingByDiscord.id },
        data: {
          role,
          roles,
          name: existingByDiscord.name ?? displayName,
          image: existingByDiscord.image ?? profile.avatar,
        },
      });
    }

    return existingByDiscord;
  }

  if (email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      const roles = mergeRoles(existingByEmail.roles, existingByEmail.role, discordRole);
      const role = getPrimaryRole(roles);
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          discordId: profile.id,
          role,
          roles,
          name: existingByEmail.name ?? displayName,
          image: existingByEmail.image ?? profile.avatar,
        },
      });
    }
  }

  return prisma.user.create({
    data: {
      name: displayName,
      email,
      discordId: profile.id,
      image: profile.avatar,
      role: discordRole,
      roles: mergeRoles(discordRole),
    },
  });
}

export const authOptions: NextAuthOptions = {
  secret:
    nextAuthSecret ??
    (process.env.NODE_ENV === "development"
      ? "nation-wheel-development-secret"
      : undefined),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(discordClientId && discordClientSecret
      ? [
          DiscordProvider({
            clientId: discordClientId,
            clientSecret: discordClientSecret,
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
          roles: user.roles,
          discordId: user.discordId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "discord") {
        const dbUser = await resolveDiscordUser({
          ...(profile as DiscordProfile | undefined),
          id: account.providerAccountId,
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.role = dbUser.role;
          token.roles = dbUser.roles;
          token.discordId = dbUser.discordId;
        }
      } else if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER;
        token.roles = (user as { roles?: Role[] }).roles ?? [token.role as Role];
        token.discordId =
          (user as { discordId?: string | null }).discordId ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.roles =
          (token.roles as Role[] | undefined) ?? [session.user.role];
        session.user.discordId =
          (token.discordId as string | null | undefined) ?? null;
      }

      return session;
    },
  },
};

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unable to resolve current user session", error);
    return null;
  }
}
