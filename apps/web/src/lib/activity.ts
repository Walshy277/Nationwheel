import { canonNations } from "@nation-wheel/shared";
import { getPrisma } from "@/lib/prisma";

export type ActivityFeedItem = {
  id: string;
  nationName: string;
  nationSlug: string;
  title: string;
  detail: string;
  type: string;
  status?: string;
  timestamp?: string;
};

export async function listActivityFeed(): Promise<ActivityFeedItem[]> {
  try {
    const actions = await getPrisma().loreAction.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        nation: { select: { name: true, slug: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
    });

    return actions.map((action) => ({
      id: action.id,
      nationName: action.nation.name,
      nationSlug: action.nation.slug,
      title: action.type,
      detail: action.updates[0]?.content ?? action.action,
      type: action.type,
      status: action.status.replace("_", " "),
      timestamp: (action.updates[0]?.createdAt ?? action.updatedAt).toISOString(),
    }));
  } catch {
    return canonNations.flatMap((nation) => {
      const notes =
        nation.statNotes?.map((note, index) => ({
          id: `${nation.slug}-note-${index}`,
          nationName: nation.name,
          nationSlug: nation.slug,
          title: "Status modifier",
          detail: note,
          type: "Current status",
          status: "Canon",
        })) ?? [];

      const actions =
        nation.actions?.map((action, index) => ({
          id: `${nation.slug}-action-${index}`,
          nationName: nation.name,
          nationSlug: nation.slug,
          title: action.type,
          detail: action.action,
          type: action.type,
          status: "Canon",
        })) ?? [];

      return [...notes, ...actions];
    });
  }
}
