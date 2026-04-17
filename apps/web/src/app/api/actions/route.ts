import { revalidatePath } from "next/cache";
import { LoreActionStatus, Role } from "@prisma/client";
import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { jsonError, requireRoleOrBot } from "@/lib/permissions";
import { loreActionSchema } from "@/lib/validation";

const botLoreActionSchema = z
  .object({
    nationSlug: z.string().min(1),
    type: z.string().min(1),
    action: z.string().min(10),
    source: z.string().nullable().optional(),
    timeframe: z.string().min(1),
    status: z.nativeEnum(LoreActionStatus).optional(),
    requiresSpinReason: z.string().nullable().optional(),
  })
  .strict();

async function findOrCreateNationBySlug(slug: string) {
  const prisma = getPrisma();
  const existing = await prisma.nation.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, leaderUserId: true },
  });
  if (existing) return existing;

  const canonNation = canonNations.find((nation) => nation.slug === slug);
  if (!canonNation) {
    throw new Error("Nation not found.");
  }

  return prisma.nation.create({
    data: {
      ...canonNation,
      wiki: {
        create: {
          content: createNationWikiTemplate(canonNation),
        },
      },
    },
    select: { id: true, slug: true, name: true, leaderUserId: true },
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireRoleOrBot(request, [
      Role.LORE,
      Role.ADMIN,
      Role.OWNER,
    ]);
    const body = botLoreActionSchema.parse(await request.json());
    const nation = await findOrCreateNationBySlug(body.nationSlug);
    const payload = loreActionSchema.parse({
      nationId: nation.id,
      type: body.type,
      action: body.action,
      source: body.source ?? null,
      timeframe: body.timeframe,
      status: body.status ?? LoreActionStatus.CURRENT,
      requiresSpinReason: body.requiresSpinReason ?? null,
    });

    const action = await getPrisma().loreAction.create({
      data: {
        ...payload,
        rygaaNotifiedAt:
          payload.status === LoreActionStatus.REQUIRES_SPIN
            ? new Date()
            : null,
        createdByUserId: user.id,
      },
      include: { nation: { select: { name: true, slug: true } } },
    });

    if (nation.leaderUserId) {
      await getPrisma().leaderNotification.create({
        data: {
          nationId: nation.id,
          title: "New canon action tracked",
          body: `Lore staff added a ${payload.type} action to your nation tracker.`,
          href: "/dashboard/actions",
          createdByUserId: user.id,
        },
      });
    }

    revalidatePath("/actions");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/actions");
    revalidatePath("/lorecp");
    revalidatePath("/lorecp/actions");
    revalidatePath(`/nations/${nation.slug}`);

    return Response.json({ action }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
