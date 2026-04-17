import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";

export const defaultGameClock = {
  day: 21,
  year: 4488,
  updatedAt: null,
  updatedByUser: null,
};

export type GameClockState = {
  day: number;
  year: number;
  updatedAt: Date | null;
  updatedByUser: {
    name: string | null;
    email: string | null;
  } | null;
};

export function formatGameDate(clock: { day: number; year: number }) {
  return `Day ${clock.day}, ${clock.year}`;
}

export async function getGameClock(): Promise<GameClockState> {
  if (!hasDatabase()) return defaultGameClock;

  try {
    return await getPrisma().gameClock.upsert({
      where: { id: "current" },
      update: {},
      create: { day: defaultGameClock.day, year: defaultGameClock.year },
      select: {
        day: true,
        year: true,
        updatedAt: true,
        updatedByUser: { select: { name: true, email: true } },
      },
    });
  } catch {
    return defaultGameClock;
  }
}
