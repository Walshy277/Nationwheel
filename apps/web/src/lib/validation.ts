import { LoreActionStatus, Role } from "@prisma/client";
import { z } from "zod";

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
    sourceLabel: z.string().nullable().optional(),
    sourceUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
  })
  .strict();
