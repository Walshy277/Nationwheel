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

async function resolveDiscordUser(profile: DiscordProfile) {
  if (!profile.id) return null;

  const prisma = getPrisma();
  const email = profile.email?.toLowerCase() ?? null;
  const displayName = profile.global_name ?? profile.username ?? null;

  const existingByDiscord = await prisma.user.findUnique({
    where: { discordId: profile.id },
  });

  if (existingByDiscord) return existingByDiscord;

  if (email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          discordId: profile.id,
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
      role: Role.USER,
    },
  });
}

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "nation-wheel-development-secret"
      : undefined),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
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
          token.discordId = dbUser.discordId;
        }
      } else if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER;
        token.discordId =
          (user as { discordId?: string | null }).discordId ?? null;
      }

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
  try {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unable to resolve current user session", error);
    return null;
  }
}
