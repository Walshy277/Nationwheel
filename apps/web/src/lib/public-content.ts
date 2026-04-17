import { getPrisma } from "@/lib/prisma";

export const publicContentDefaults = {
  wars: {
    title: "Wars",
    content: `# Wars

No public war briefings have been published yet.

## Active Wars

- Add canon wars here.

## Frozen Conflicts

- Add frozen or unresolved conflicts here.

## Recent Outcomes

- Add concluded wars, settlements, occupations, or peace terms here.`,
  },
  lore: {
    title: "Nation Wheel Lore",
    content: `# Nation Wheel Lore

This page is the public world-lore hub.

## Setting

Add the world's origin, major regions, recurring powers, and the tone of the world here.

## Current Era

Add the current season context, major events, blocs, global crises, and story direction here.

## Factions and Forces

Add global blocs, ideologies, institutions, religions, technologies, or mysteries that shape the setting.

## Canon Rules

Add public lore rules, action expectations, and how canon decisions are handled here.

## World Timeline

Add key events in order as the world develops.`,
  },
  announcements: {
    title: "Announcements",
    content: `# Announcements

- Welcome to Nation Wheel.
- Check the actions page for active canon updates.
- Watch World News for official reports.`,
  },
} as const;

export type PublicContentKey = keyof typeof publicContentDefaults;

export function isPublicContentKey(value: string): value is PublicContentKey {
  return (
    value === "wars" ||
    value === "lore" ||
    value === "announcements"
  );
}

export function getPublicContentHref(key: PublicContentKey) {
  if (key === "announcements") return "/news";
  return `/${key}`;
}

export async function getPublicContentPage(key: PublicContentKey) {
  const fallback = publicContentDefaults[key];

  try {
    const page = await getPrisma().publicLorePage.findUnique({
      where: { key },
      include: {
        updatedByUser: { select: { name: true, email: true } },
      },
    });

    return page ?? { ...fallback, key, updatedAt: null, updatedByUser: null };
  } catch {
    return { ...fallback, key, updatedAt: null, updatedByUser: null };
  }
}
