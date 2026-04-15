import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      discordId?: string | null;
    };
  }

  interface User {
    role?: Role;
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    discordId?: string | null;
    discordAccessToken?: string | null;
  }
}
