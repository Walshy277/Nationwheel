import { AlertCategory, LoreActionStatus, ReactionKind, Role } from "@prisma/client";
import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .url()
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const nationStatsSchema = z
  .object({
    name: z.string().min(1),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/),
    people: z.string().min(1),
    government: z.string().min(1),
    gdp: z.string().min(1),
    economy: z.string().min(1),
    military: z.string().min(1),
    area: z.string().nullable().optional(),
    geoPoliticalStatus: z.string().nullable().optional(),
    block: z.string().nullable().optional(),
    culture: z.string().nullable().optional(),
    hdi: z.string().nullable().optional(),
    leaderUserId: z.string().nullable().optional(),
  })
  .strict();

export const leaderNameSchema = z
  .object({
    leaderName: z.string().min(1).max(120),
  })
  .strict();

export const wikiUpdateSchema = z
  .object({
    content: z.string().min(1),
  })
  .strict();

export const overviewUpdateSchema = z
  .object({
    overview: z.string().min(80).max(2500),
  })
  .strict();

export const roleUpdateSchema = z
  .object({
    roles: z.array(z.nativeEnum(Role)).min(1),
  })
  .strict();

export const assignNationSchema = z
  .object({
    nationId: z.string().nullable(),
  })
  .strict();

export const discordUserLinkSchema = z
  .object({
    discordId: z
      .string()
      .regex(/^\d{17,20}$/, "Discord user ID must be 17-20 digits."),
  })
  .strict();

export const loreActionSchema = z
  .object({
    nationId: z.string().min(1),
    type: z.string().min(1),
    action: z.string().min(10),
    source: z.string().nullable().optional(),
    timeframe: z.string().min(1),
    status: z.nativeEnum(LoreActionStatus),
    requiresSpinReason: z.string().nullable().optional(),
  })
  .strict();

export const loreActionEditSchema = loreActionSchema;

export const loreActionUpdateSchema = z
  .object({
    content: z.string().min(1),
  })
  .strict();

export const loreActionStatusSchema = z
  .object({
    status: z.nativeEnum(LoreActionStatus),
    requiresSpinReason: z.string().nullable().optional(),
  })
  .strict();

export const loreActionCompletionSchema = z
  .object({
    outcome: z.string().min(10),
    people: z.string().nullable().optional(),
    government: z.string().nullable().optional(),
    gdp: z.string().nullable().optional(),
    economy: z.string().nullable().optional(),
    military: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    geoPoliticalStatus: z.string().nullable().optional(),
    block: z.string().nullable().optional(),
    culture: z.string().nullable().optional(),
    hdi: z.string().nullable().optional(),
  })
  .strict();

export const publicLorePageSchema = z
  .object({
    title: z.string().min(1),
    content: z.string().min(1),
  })
  .strict();

export const worldNewsPostSchema = z
  .object({
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(280),
    content: z.string().min(1),
    heroImageUrl: optionalUrlSchema,
    sourceLabel: z.string().nullable().optional(),
    sourceUrl: optionalUrlSchema,
  })
  .strict();

export const nationMessageSchema = z
  .object({
    fromNationId: z.string().min(1),
    toNationId: z.string().min(1),
    subject: z.string().min(1).max(140),
    body: z.string().min(1).max(5000),
  })
  .strict();

export const reactionSchema = z
  .object({
    kind: z.nativeEnum(ReactionKind),
  })
  .strict();

export const forumThreadSchema = z
  .object({
    title: z.string().min(4).max(140),
    category: z.string().min(1).max(48),
    body: z.string().min(10).max(8000),
    imageUrl: optionalUrlSchema,
  })
  .strict();

export const forumPostSchema = z
  .object({
    body: z.string().min(2).max(8000),
    imageUrl: optionalUrlSchema,
  })
  .strict();

export const alertPreferencesSchema = z
  .object({
    alertOptOuts: z.array(z.nativeEnum(AlertCategory)),
  })
  .strict();

export const spinResultSchema = z
  .object({
    prompt: z.string().min(1).max(200),
    result: z.string().min(1).max(160),
    options: z.string().min(1).max(4000),
    note: z.string().max(2000).optional().default(""),
  })
  .strict();

export const nationSecretEntrySchema = z
  .object({
    actionId: z.string().nullable().optional(),
    title: z.string().min(3).max(160),
    content: z.string().min(1).max(8000),
  })
  .strict();
