"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LoreActionStatus, Role } from "@prisma/client";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import { getPrisma } from "@/lib/prisma";
import { requireRole, requireUser, requireWikiEditAccess } from "@/lib/permissions";
import {
  assignNationSchema,
  discordUserLinkSchema,
  leaderNameSchema,
  loreActionSchema,
  loreActionStatusSchema,
  loreActionUpdateSchema,
  nationStatsSchema,
  publicLorePageSchema,
  roleUpdateSchema,
  wikiUpdateSchema,
} from "@/lib/validation";
import {
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

async function readFlagDataUrl(formData: FormData) {
  const file = formData.get("flag");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("Flag upload must be an image.");
  }
  if (file.size > 2_000_000) {
    throw new Error("Profile picture must be under 2 MB.");
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

function highestRole(roles: Role[]) {
  const rank: Record<Role, number> = {
    USER: 0,
    LEADER: 1,
    LORE: 2,
    ADMIN: 3,
    OWNER: 4,
  };

  return roles.reduce(
    (primary, role) => (rank[role] > rank[primary] ? role : primary),
    Role.USER,
  );
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
    leaderUserId: readNullableText(formData, "leaderUserId"),
  });
}

async function readOptionalFlagRevision(formData: FormData) {
  const flagImage = await readFlagDataUrl(formData);
  return flagImage ? { flagImage } : {};
}

export async function createNationAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.OWNER]);
  const payload = nationPayloadFromForm(formData);
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
            ...payload,
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
          newValue: payload,
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

  const returnPath = readText(formData, "returnPath");
  if (returnPath.startsWith("/")) redirect(returnPath);
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
}

export async function updateLoreActionStatusAction(
  actionId: string,
  formData: FormData,
) {
  await requireRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const payload = loreActionStatusSchema.parse({
    status: readText(formData, "status"),
    requiresSpinReason: readNullableText(formData, "requiresSpinReason"),
  });

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
  revalidatePath(`/lorecp/nations/${current.nationId}`);
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
  revalidatePath(`/lorecp/nations/${action.nationId}`);
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

  revalidatePath(`/${key}`);
  revalidatePath(`/lorecp/pages/${key}`);
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
