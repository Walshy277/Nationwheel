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

export const authOptions: NextAuthOptions = {
  debug: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  logger: {
    error(code, metadata) {
      console.error("NEXTAUTH LOGGER ERROR", code, metadata);
    },
    warn(code) {
      console.warn("NEXTAUTH LOGGER WARN", code);
    },
    debug(code, metadata) {
      console.log("NEXTAUTH LOGGER DEBUG", code, metadata);
    },
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
      console.error("JWT CALLBACK START", {
        hasTokenSub: !!token.sub,
        provider: account?.provider ?? null,
        providerAccountId: account?.providerAccountId ?? null,
        hasUser: !!user,
        hasProfile: !!profile,
      });

      const accountDiscordId =
        account?.provider === "discord" ? account.providerAccountId : null;

      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER;
        token.discordId =
          accountDiscordId ??
          (user as { discordId?: string | null }).discordId ??
          null;
      }

      console.error("JWT CALLBACK END", {
        tokenSub: token.sub ?? null,
        role: token.role ?? null,
        discordId: token.discordId ?? null,
      });

      return token;
    },

    async session({ session, token }) {
      console.error("SESSION CALLBACK START", {
        tokenSub: token.sub ?? null,
        role: token.role ?? null,
        discordId: token.discordId ?? null,
      });

      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.discordId =
          (token.discordId as string | null | undefined) ?? null;
      }

      console.error("SESSION CALLBACK END", {
        sessionUserId: session.user?.id ?? null,
        sessionRole: session.user?.role ?? null,
        sessionDiscordId: session.user?.discordId ?? null,
      });

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