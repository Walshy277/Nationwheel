import { Prisma, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Insufficient permissions");
  }

  return user;
}

function hasValidBotKey(request: Request) {
  const expected = process.env.NATION_WHEEL_BOT_API_KEY;
  const received = request.headers.get("x-nation-wheel-bot-key");
  return Boolean(expected && received && received === expected);
}

export async function requireRoleOrBot(request: Request, roles: Role[]) {
  if (hasValidBotKey(request)) {
    return { id: undefined, role: roles[0] };
  }

  return requireRole(roles);
}

export async function requireWikiEditAccess(nationId: string) {
  const user = await requireUser();

  if ([Role.LORE, Role.ADMIN, Role.OWNER].includes(user.role)) {
    return user;
  }

  if (user.role !== Role.LEADER) {
    throw new HttpError(403, "Cannot edit this nation wiki");
  }

  const nation = await getPrisma().nation.findUnique({
    where: { id: nationId },
    select: { leaderUserId: true },
  });

  if (!nation || nation.leaderUserId !== user.id) {
    throw new HttpError(403, "Cannot edit this nation wiki");
  }

  return user;
}

export async function requireWikiEditAccessOrBot(
  request: Request,
  nationId: string,
) {
  if (hasValidBotKey(request)) {
    return { id: undefined, role: Role.LORE };
  }

  return requireWikiEditAccess(nationId);
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: "Invalid request body",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }

  console.error(error);
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageRole(roles: Role[]) {
  const user = await requirePageUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
