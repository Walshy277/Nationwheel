"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LoreActionStatus, Prisma, Role } from "@prisma/client";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import { getPrisma } from "@/lib/prisma";
import { requireRole, requireUser, requireWikiEditAccess } from "@/lib/permissions";
import {
  assignNationSchema,
  discordUserLinkSchema,
  loreActionCompletionSchema,
  loreActionEditSchema,
  leaderNameSchema,
  loreActionSchema,
  loreActionStatusSchema,
  loreActionUpdateSchema,
  nationMessageSchema,
  nationStatsSchema,
  overviewUpdateSchema,
  publicLorePageSchema,
  roleUpdateSchema,
  wikiUpdateSchema,
  worldNewsPostSchema,
} from "@/lib/validation";
import {
  getPublicContentHref,
  isPublicContentKey,
  publicContentDefaults,
} from "@/lib/public-content";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNullableText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readOptionalNullableText(formData: FormData, key: string) {
  return formData.has(key) ? readNullableText(formData, key) : undefined;
}

async function readFlagDataUrl(formData: FormData) {
  const file = formData.get("flag");
  if (!(file instanceof File) || file.size === 0) return null;
  const supportedImageTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ]);
  if (!supportedImageTypes.has(file.type)) {
    throw new Error("Flag upload must be a PNG, JPG, GIF, or WebP image.");
  }
  if (file.size > 5_000_000) {
    throw new Error("Profile picture must be under 5 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function withoutUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Prisma.InputJsonObject;
}

function highestRole(roles: Role[]) {
  const rank: Record<Role, number> = {
    USER: 0,
    LEADER: 1,
    JOURNALIST: 2,
    LORE: 3,
    ADMIN: 4,
    OWNER: 5,
  };

  return roles.reduce(
    (primary, role) => (rank[role] > rank[primary] ? role : primary),
    Role.USER,
  );
}

function userHasStaffRole(user: { role: Role; roles?: Role[] | null }) {
  const roles = new Set([user.role, ...(user.roles ?? [])]);
  return roles.has(Role.LORE) || roles.has(Role.ADMIN) || roles.has(Role.OWNER);
}

async function notifyNationLeader({
  nationId,
  actorUserId,
  title,
  body,
  href,
}: {
  nationId: string;
  actorUserId?: string | null;
  title: string;
  body: string;
  href?: string;
}) {
  const prisma = getPrisma();
  const nation = await prisma.nation.findUnique({
    where: { id: nationId },
    select: { leaderUserId: true },
  });

  if (!nation?.leaderUserId || nation.leaderUserId === actorUserId) return;

  await prisma.leaderNotification.create({
    data: {
      nationId,
      title,
      body,
      href,
      createdByUserId: actorUserId ?? undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/actions");
  revalidatePath("/dashboard/notifications");
}

function nationPayloadFromForm(formData: FormData) {
  const name = readText(formData, "name");
  return nationStatsSchema.parse({
    name,
    slug: readText(formData, "slug") || slugify(name),
    people: readText(formData, "people"),
    government: readText(formData, "government"),
    gdp: readText(formData, "gdp"),
    economy: readText(formData, "economy"),
    military: readText(formData, "military"),
    area: readOptionalNullableText(formData, "area"),
    geoPoliticalStatus: readOptionalNullableText(
      formData,
      "geoPoliticalStatus",
    ),
    block: readOptionalNullableText(formData, "block"),
    culture: readOptionalNullableText(formData, "culture"),
    hdi: readOptionalNullableText(formData, "hdi"),
    leaderUserId: readOptionalNullableText(formData, "leaderUserId"),
  });
}

const completionStatKeys = [
  "people",
  "government",
  "gdp",
  "economy",
  "military",
  "area",
  "geoPoliticalStatus",
  "block",
  "culture",
  "hdi",
] as const;

type CompletionStatKey = (typeof completionStatKeys)[number];

function actionCompletionPayloadFromForm(formData: FormData) {
  const stats = Object.fromEntries(
    completionStatKeys.map((key) => [key, readNullableText(formData, key)]),
  ) as Record<CompletionStatKey, string | null>;

  return loreActionCompletionSchema.parse({
    outcome: readText(formData, "outcome"),
    ...stats,
  });
}

async function readOptionalFlagRevision(formData: FormData) {
  const flagImage = await readFlagDataUrl(formData);
  return flagImage ? { flagImage } : {};
}

export async function createNationAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.OWNER]);
  const payload = nationPayloadFromForm(formData);
  const revisionPayload = withoutUndefinedValues(payload);
  const flagData = await readOptionalFlagRevision(formData);

  await getPrisma().nation.create({
    data: {
      ...payload,
      ...flagData,
      leaderUserId: payload.leaderUserId ?? undefined,
      wiki: {
        create: {
          content: createNationWikiTemplate(payload),
          updatedByUserId: user.id,
        },
      },
      revisions: {
        create: {
          fieldType: "STATS",
          previousValue: {},
          newValue: {
            ...revisionPayload,
            ...(flagData.flagImage ? { flagImage: "uploaded" } : {}),
          },
          changedByUserId: user.id,
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admincp/nations");
  revalidatePath("/nations");
  revalidatePath("/map");
}

export async function updateNationStatsAction(
  nationId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = nationPayloadFromForm(formData);
  const revisionPayload = withoutUndefinedValues(payload);
  const flagData = await readOptionalFlagRevision(formData);
  const prisma = getPrisma();
  const current = await prisma.nation.findUniqueOrThrow({
    where: { id: nationId },
  });

  await prisma.nation.update({
    where: { id: nationId },
    data: {
      ...payload,
      ...flagData,
      leaderUserId: payload.leaderUserId,
      revisions: {
        create: {
          fieldType: "STATS",
          previousValue: {
            name: current.name,
            slug: current.slug,
            people: current.people,
            government: current.government,
            gdp: current.gdp,
            economy: current.economy,
            military: current.military,
            leaderUserId: current.leaderUserId,
            flagImage: current.flagImage ? "uploaded" : null,
          },
          newValue: revisionPayload,
          changedByUserId: user.id,
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admincp/nations");
  revalidatePath(`/lorecp/nations/${nationId}`);
  revalidatePath("/nations");
  revalidatePath(`/nations/${payload.slug}`);
  revalidatePath("/dashboard/wiki");

  if (userHasStaffRole(user)) {
    await notifyNationLeader({
      nationId,
      actorUserId: user.id,
      title: "Nation stats updated",
      body: "Staff updated your nation's structured canon stats.",
      href: `/nations/${payload.slug}`,
    });
  }

  const returnPath = readText(formData, "returnPath");
  if (returnPath.startsWith("/")) redirect(returnPath);
}

export async function updateLeaderNameAction(
  nationId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const payload = leaderNameSchema.parse({
    leaderName: readText(formData, "leaderName"),
  });
  const prisma = getPrisma();
  const nation = await prisma.nation.findUniqueOrThrow({
    where: { id: nationId },
    select: { id: true, slug: true, leaderName: true, leaderUserId: true },
  });

  const userRoles = new Set([user.role, ...(user.roles ?? [])]);
  const canEdit =
    userRoles.has(Role.ADMIN) ||
    userRoles.has(Role.OWNER) ||
    nation.leaderUserId === user.id;

  if (!canEdit) {
    throw new Error("You do not have permission to update this leader name.");
  }

  await prisma.nation.update({
    where: { id: nationId },
    data: {
      leaderName: payload.leaderName,
      revisions: {
        create: {
          fieldType: "LEADER_NAME",
          previousValue: { leaderName: nation.leaderName ?? null },
          newValue: { leaderName: payload.leaderName },
          changedByUserId: user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard/wiki");
  revalidatePath(`/nations/${nation.slug}`);
  revalidatePath(`/lorecp/nations/${nationId}`);
  revalidatePath("/admincp/nations");

  const returnPath = readText(formData, "returnPath");
  if (returnPath.startsWith("/")) redirect(returnPath);
}

export async function deleteNationAction(nationId: string) {
  await requireRole([Role.ADMIN, Role.OWNER]);
  await getPrisma().nation.delete({ where: { id: nationId } });

  revalidatePath("/");
  revalidatePath("/admincp/nations");
  revalidatePath("/nations");
  revalidatePath("/map");
}

export async function updateWikiAction(nationId: string, formData: FormData) {
  const user = await requireWikiEditAccess(nationId);
  const payload = wikiUpdateSchema.parse({
    content: readText(formData, "content"),
  });
  const prisma = getPrisma();
  const previous = await prisma.nationWiki.findUnique({ where: { nationId } });
  const nation = await prisma.nation.findUnique({ where: { id: nationId }, select: { slug: true } });

  await prisma.nationWiki.upsert({
    where: { nationId },
    update: {
      content: payload.content,
      updatedByUserId: user.id,
    },
    create: {
      nationId,
      content: payload.content,
      updatedByUserId: user.id,
    },
  });

  await prisma.nationRevision.create({
    data: {
      nationId,
      fieldType: "WIKI",
      previousValue: { content: previous?.content ?? null },
      newValue: { content: payload.content },
      changedByUserId: user.id,
    },
  });

  revalidatePath("/dashboard/wiki");
  revalidatePath(`/lorecp/nations/${nationId}`);
  revalidatePath("/admincp/logs");
  revalidatePath("/nations");
  if (nation?.slug) revalidatePath(`/nations/${nation.slug}`);

  if (userHasStaffRole(user)) {
    await notifyNationLeader({
      nationId,
      actorUserId: user.id,
      title: "Nation wiki updated",
      body: "Staff edited your nation's public wiki.",
      href: nation?.slug ? `/nations/${nation.slug}` : "/dashboard/wiki",
    });
  }
}

export async function updateNationFlagAction(
  nationId: string,
  formData: FormData,
) {
  const user = await requireWikiEditAccess(nationId);
  const flagImage = await readFlagDataUrl(formData);
  if (!flagImage) return;

  const prisma = getPrisma();
  const current = await prisma.nation.findUniqueOrThrow({
    where: { id: nationId },
    select: { flagImage: true, slug: true },
  });

  await prisma.nation.update({
    where: { id: nationId },
    data: {
      flagImage,
      revisions: {
        create: {
          fieldType: "FLAG",
          previousValue: { flagImage: current.flagImage ? "uploaded" : null },
          newValue: { flagImage: "uploaded" },
          changedByUserId: user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard/wiki");
  revalidatePath(`/nations/${current.slug}`);
  revalidatePath("/nations");

  if (userHasStaffRole(user)) {
    await notifyNationLeader({
      nationId,
      actorUserId: user.id,
      title: "Profile picture updated",
      body: "Staff updated your nation's public profile picture.",
      href: `/nations/${current.slug}`,
    });
  }

  const returnPath = readText(formData, "returnPath");
  if (returnPath.startsWith("/")) redirect(returnPath);
}

export async function updateNationOverviewAction(
  nationId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = overviewUpdateSchema.parse({
    overview: readText(formData, "overview"),
  });
  const prisma = getPrisma();
  const current = await prisma.nation.findUniqueOrThrow({
    where: { id: nationId },
    select: { overview: true, slug: true },
  });

  await prisma.nation.update({
    where: { id: nationId },
    data: {
      overview: payload.overview,
      revisions: {
        create: {
          fieldType: "STATS",
          previousValue: { overview: current.overview ?? null },
          newValue: { overview: payload.overview },
          changedByUserId: user.id,
        },
      },
    },
  });

  revalidatePath("/nations");
  revalidatePath(`/nations/${current.slug}`);
  revalidatePath(`/lorecp/nations/${nationId}`);
  revalidatePath("/admincp/logs");

  await notifyNationLeader({
    nationId,
    actorUserId: user.id,
    title: "Nation overview updated",
    body: "Lore staff updated your nation's public overview.",
    href: `/nations/${current.slug}`,
  });
}

export async function createLoreActionAction(formData: FormData) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = loreActionSchema.parse({
    nationId: readText(formData, "nationId"),
    type: readText(formData, "type"),
    action: readText(formData, "action"),
    source: readNullableText(formData, "source"),
    timeframe: readText(formData, "timeframe"),
    status: readText(formData, "status") || LoreActionStatus.CURRENT,
    requiresSpinReason: readNullableText(formData, "requiresSpinReason"),
  });

  await getPrisma().loreAction.create({
    data: {
      ...payload,
      rygaaNotifiedAt:
        payload.status === LoreActionStatus.REQUIRES_SPIN ? new Date() : null,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/lorecp");
  revalidatePath("/lorecp/actions");
  revalidatePath(`/lorecp/nations/${payload.nationId}`);

  await notifyNationLeader({
    nationId: payload.nationId,
    actorUserId: user.id,
    title: "New canon action tracked",
    body: `Lore staff added a ${payload.type} action to your nation tracker.`,
    href: "/dashboard/actions",
  });
}

export async function updateLoreActionStatusAction(
  actionId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = loreActionStatusSchema.parse({
    status: readText(formData, "status"),
    requiresSpinReason: readNullableText(formData, "requiresSpinReason"),
  });
  if (payload.status === LoreActionStatus.COMPLETED) {
    throw new Error("Complete actions with an outcome and stat effects.");
  }

  const current = await getPrisma().loreAction.findUniqueOrThrow({
    where: { id: actionId },
    select: { nationId: true, rygaaNotifiedAt: true },
  });

  await getPrisma().loreAction.update({
    where: { id: actionId },
    data: {
      status: payload.status,
      requiresSpinReason: payload.requiresSpinReason,
      rygaaNotifiedAt:
        payload.status === LoreActionStatus.REQUIRES_SPIN
          ? (current.rygaaNotifiedAt ?? new Date())
          : current.rygaaNotifiedAt,
    },
  });

  revalidatePath("/lorecp");
  revalidatePath("/lorecp/actions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/actions");
  revalidatePath("/actions");
  revalidatePath(`/lorecp/nations/${current.nationId}`);

  await notifyNationLeader({
    nationId: current.nationId,
    actorUserId: user.id,
    title: "Action status updated",
    body:
      payload.status === LoreActionStatus.REQUIRES_SPIN
        ? "Lore staff marked one of your actions as requiring a spin."
        : `Lore staff moved one of your actions to ${payload.status.replace("_", " ").toLowerCase()}.`,
    href: "/dashboard/actions",
  });
}

export async function completeLoreActionAction(
  actionId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = actionCompletionPayloadFromForm(formData);
  const prisma = getPrisma();

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.loreAction.findUniqueOrThrow({
      where: { id: actionId },
      include: {
        nation: {
          select: {
            id: true,
            slug: true,
            name: true,
            leaderUserId: true,
            people: true,
            government: true,
            gdp: true,
            economy: true,
            military: true,
            area: true,
            geoPoliticalStatus: true,
            block: true,
            culture: true,
            hdi: true,
          },
        },
      },
    });

    const statUpdates = Object.fromEntries(
      completionStatKeys
        .map((key) => [key, payload[key]] as const)
        .filter((entry): entry is readonly [CompletionStatKey, string] => {
          const [key, value] = entry;
          return Boolean(value && value !== current.nation[key]);
        }),
    ) as Partial<Record<CompletionStatKey, string>>;

    await tx.loreAction.update({
      where: { id: actionId },
      data: {
        status: LoreActionStatus.COMPLETED,
        outcome: payload.outcome,
      },
    });

    if (Object.keys(statUpdates).length) {
      await tx.nation.update({
        where: { id: current.nationId },
        data: {
          ...statUpdates,
          revisions: {
            create: {
              fieldType: "STATS",
              previousValue: Object.fromEntries(
                Object.keys(statUpdates).map((key) => [
                  key,
                  current.nation[key as CompletionStatKey],
                ]),
              ),
              newValue: statUpdates,
              changedByUserId: user.id,
            },
          },
        },
      });
    }

    return {
      nationId: current.nationId,
      nationSlug: current.nation.slug,
      statUpdateCount: Object.keys(statUpdates).length,
    };
  });

  revalidatePath("/");
  revalidatePath("/lorecp");
  revalidatePath("/lorecp/actions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/actions");
  revalidatePath("/actions");
  revalidatePath("/nations");
  revalidatePath(`/nations/${result.nationSlug}`);
  revalidatePath(`/lorecp/nations/${result.nationId}`);
  revalidatePath("/admincp/logs");

  await notifyNationLeader({
    nationId: result.nationId,
    actorUserId: user.id,
    title: "Action completed",
    body:
      result.statUpdateCount > 0
        ? `Lore staff completed an action and updated ${result.statUpdateCount} nation stat${result.statUpdateCount === 1 ? "" : "s"}.`
        : "Lore staff completed one of your canon actions.",
    href: "/dashboard/actions",
  });
}

export async function updateLoreActionAction(
  actionId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = loreActionEditSchema.parse({
    nationId: readText(formData, "nationId"),
    type: readText(formData, "type"),
    action: readText(formData, "action"),
    source: readNullableText(formData, "source"),
    timeframe: readText(formData, "timeframe"),
    status: readText(formData, "status") || LoreActionStatus.CURRENT,
    requiresSpinReason: readNullableText(formData, "requiresSpinReason"),
  });
  if (payload.status === LoreActionStatus.COMPLETED) {
    throw new Error("Complete actions with an outcome and stat effects.");
  }
  const current = await getPrisma().loreAction.findUniqueOrThrow({
    where: { id: actionId },
    select: { nationId: true, rygaaNotifiedAt: true },
  });

  await getPrisma().loreAction.update({
    where: { id: actionId },
    data: {
      ...payload,
      rygaaNotifiedAt:
        payload.status === LoreActionStatus.REQUIRES_SPIN
          ? (current.rygaaNotifiedAt ?? new Date())
          : current.rygaaNotifiedAt,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/actions");
  revalidatePath("/actions");
  revalidatePath("/lorecp");
  revalidatePath("/lorecp/actions");
  revalidatePath(`/lorecp/nations/${current.nationId}`);
  revalidatePath(`/lorecp/nations/${payload.nationId}`);

  await notifyNationLeader({
    nationId: payload.nationId,
    actorUserId: user.id,
    title: "Canon action edited",
    body: `Lore staff edited a ${payload.type} action on your nation tracker.`,
    href: "/dashboard/actions",
  });
}

export async function addLoreActionUpdateAction(
  actionId: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = loreActionUpdateSchema.parse({
    content: readText(formData, "content"),
  });

  const action = await getPrisma().loreAction.findUniqueOrThrow({
    where: { id: actionId },
    select: { nationId: true },
  });

  await getPrisma().loreActionUpdate.create({
    data: {
      actionId,
      content: payload.content,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/lorecp");
  revalidatePath("/lorecp/actions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/actions");
  revalidatePath("/actions");
  revalidatePath(`/lorecp/nations/${action.nationId}`);

  await notifyNationLeader({
    nationId: action.nationId,
    actorUserId: user.id,
    title: "Action update posted",
    body: "Lore staff posted a new update on one of your canon actions.",
    href: "/dashboard/actions",
  });
}

export async function markLeaderNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  const notification = await getPrisma().leaderNotification.findUniqueOrThrow({
    where: { id: notificationId },
    select: { nation: { select: { leaderUserId: true } } },
  });

  if (notification.nation.leaderUserId !== user.id) {
    throw new Error("You do not have permission to update this notification.");
  }

  await getPrisma().leaderNotification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
}

export async function createNationMessageAction(formData: FormData) {
  const user = await requireUser();
  const payload = nationMessageSchema.parse({
    fromNationId: readText(formData, "fromNationId"),
    toNationId: readText(formData, "toNationId"),
    subject: readText(formData, "subject"),
    body: readText(formData, "body"),
  });

  if (payload.fromNationId === payload.toNationId) {
    throw new Error("Choose a different nation to message.");
  }

  const prisma = getPrisma();
  const fromNation = await prisma.nation.findUniqueOrThrow({
    where: { id: payload.fromNationId },
    select: { id: true, name: true, leaderUserId: true },
  });
  const toNation = await prisma.nation.findUniqueOrThrow({
    where: { id: payload.toNationId },
    select: { id: true, name: true },
  });

  if (fromNation.leaderUserId !== user.id) {
    throw new Error("You can only send messages from your own nation.");
  }

  await prisma.nationMessage.create({
    data: payload,
  });

  await notifyNationLeader({
    nationId: toNation.id,
    actorUserId: user.id,
    title: `Message from ${fromNation.name}`,
    body: payload.subject,
    href: "/dashboard/messages",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
}

export async function advanceGameDayAction() {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);

  await getPrisma().gameClock.upsert({
    where: { id: "current" },
    update: {
      day: { increment: 1 },
      updatedByUserId: user.id,
    },
    create: {
      day: 22,
      year: 4488,
      updatedByUserId: user.id,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/lorecp");
  revalidatePath("/admincp");
  revalidatePath("/actions");
  revalidatePath("/news");
}

export async function markNationMessageReadAction(messageId: string) {
  const user = await requireUser();
  const message = await getPrisma().nationMessage.findUniqueOrThrow({
    where: { id: messageId },
    select: { toNation: { select: { leaderUserId: true } } },
  });

  if (message.toNation.leaderUserId !== user.id) {
    throw new Error("You do not have permission to update this message.");
  }

  await getPrisma().nationMessage.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
}

export async function updatePublicLorePageAction(
  key: string,
  formData: FormData,
) {
  const user = await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  if (!isPublicContentKey(key)) {
    throw new Error("Unknown public lore page.");
  }

  const payload = publicLorePageSchema.parse({
    title: readText(formData, "title"),
    content: readText(formData, "content"),
  });

  await getPrisma().publicLorePage.upsert({
    where: { key },
    update: {
      title: payload.title,
      content: payload.content,
      updatedByUserId: user.id,
    },
    create: {
      key,
      title: payload.title || publicContentDefaults[key].title,
      content: payload.content || publicContentDefaults[key].content,
      updatedByUserId: user.id,
    },
  });

  revalidatePath(getPublicContentHref(key));
  revalidatePath(`/lorecp/pages/${key}`);
}

export async function createWorldNewsPostAction(formData: FormData) {
  const user = await requireRole([
    Role.JOURNALIST,
    Role.LORE,
    Role.ADMIN,
    Role.OWNER,
  ]);
  const payload = worldNewsPostSchema.parse({
    title: readText(formData, "title"),
    summary: readText(formData, "summary"),
    content: readText(formData, "content"),
    sourceLabel: readNullableText(formData, "sourceLabel"),
    sourceUrl: readNullableText(formData, "sourceUrl"),
  });

  await getPrisma().worldNewsPost.create({
    data: {
      ...payload,
      authorId: user.id,
    },
  });

  revalidatePath("/news");
  revalidatePath("/newscp");
  redirect("/newscp");
}

export async function updateWorldNewsPostAction(
  postId: string,
  formData: FormData,
) {
  await requireRole([Role.JOURNALIST, Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = worldNewsPostSchema.parse({
    title: readText(formData, "title"),
    summary: readText(formData, "summary"),
    content: readText(formData, "content"),
    sourceLabel: readNullableText(formData, "sourceLabel"),
    sourceUrl: readNullableText(formData, "sourceUrl"),
  });

  await getPrisma().worldNewsPost.update({
    where: { id: postId },
    data: payload,
  });

  revalidatePath("/news");
  revalidatePath("/newscp");
  redirect("/newscp");
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  await requireRole([Role.ADMIN, Role.OWNER]);
  const payload = roleUpdateSchema.parse({
    roles: formData.getAll("roles").filter((role): role is string => typeof role === "string"),
  });

  await getPrisma().user.update({
    where: { id: userId },
    data: { role: highestRole(payload.roles), roles: payload.roles },
  });

  revalidatePath("/admincp/users");
}

export async function assignUserNationAction(
  userId: string,
  formData: FormData,
) {
  await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = assignNationSchema.parse({
    nationId: readNullableText(formData, "nationId"),
  });
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true },
    });

    if (payload.nationId) {
      await tx.nation.findUniqueOrThrow({
        where: { id: payload.nationId },
        select: { id: true },
      });

      await tx.nation.update({
        where: { id: payload.nationId },
        data: { leaderUserId: userId },
      });
    }
  });

  revalidatePath("/admincp/users");
  revalidatePath("/admincp/nations");
  revalidatePath("/nations");
  revalidatePath("/dashboard/wiki");
}

export async function updateUserDiscordAction(
  userId: string,
  formData: FormData,
) {
  await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = discordUserLinkSchema.parse({
    discordId: readText(formData, "discordId"),
  });

  await getPrisma().user.update({
    where: { id: userId },
    data: { discordId: payload.discordId },
  });

  revalidatePath("/admincp/users");
}
