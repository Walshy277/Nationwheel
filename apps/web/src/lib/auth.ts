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
            authorization: { params: { scope: "identify email" } },
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
          nationId: user.nationId,
          discordId: user.discordId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "discord" && token.sub) {
        await getPrisma().user.update({
          where: { id: token.sub },
          data: { discordId: account.providerAccountId },
        });
      }

      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.LEADER;
        token.nationId =
          (user as { nationId?: string | null }).nationId ?? null;
        token.discordId =
          (user as { discordId?: string | null }).discordId ?? null;
      }

      if (token.sub) {
        const dbUser = await getPrisma().user.findUnique({
          where: { id: token.sub },
          select: { role: true, nationId: true, discordId: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.nationId = dbUser.nationId;
          token.discordId = dbUser.discordId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.LEADER;
        session.user.nationId =
          (token.nationId as string | null | undefined) ?? null;
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
