import { type AlertCategory, type RevisionFieldType } from "@prisma/client";
import { alertCategoryLabel } from "@/lib/alerts";
import { getPrisma } from "@/lib/prisma";

type Actor = {
  name: string | null;
  email: string | null;
} | null;

export type AdminLogEvent = {
  id: string;
  kind: "revision" | "action_update" | "notification" | "news";
  tone: "accent" | "warning" | "neutral";
  title: string;
  summary: string;
  actor: string;
  createdAt: Date;
  href: string;
  search: string;
  details: Array<{ label: string; value: string }>;
};

function formatActor(actor: Actor) {
  return actor?.name ?? actor?.email ?? "System";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function summarizeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Empty";
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117).trimEnd()}...` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function changedFields(previousValue: unknown, newValue: unknown) {
  const previous = asRecord(previousValue);
  const next = asRecord(newValue);
  return Object.keys(next)
    .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
    .map((key) => ({
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
      before: summarizeValue(previous[key]),
      after: summarizeValue(next[key]),
    }));
}

function revisionTitle(fieldType: RevisionFieldType) {
  const titles: Record<RevisionFieldType, string> = {
    ACTION: "Action record changed",
    FLAG: "Profile picture changed",
    LEADER_NAME: "Leader name changed",
    STATS: "Stats updated",
    WIKI: "Wiki edited",
  };

  return titles[fieldType];
}

function notificationSummary(category: AlertCategory, title: string, body: string) {
  return `${alertCategoryLabel(category)} alert: ${title}. ${body}`;
}

export async function listAdminLogEvents(limit = 120) {
  const prisma = getPrisma();
  const [revisions, actionUpdates, notifications, newsPosts] =
    await prisma.$transaction([
      prisma.nationRevision.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          nation: { select: { id: true, name: true, slug: true } },
          changedByUser: { select: { name: true, email: true } },
        },
      }),
      prisma.loreActionUpdate.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          createdByUser: { select: { name: true, email: true } },
          action: {
            select: {
              id: true,
              type: true,
              nationId: true,
              nation: { select: { name: true } },
            },
          },
        },
      }),
      prisma.leaderNotification.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          nation: { select: { id: true, name: true } },
          createdByUser: { select: { name: true, email: true } },
        },
      }),
      prisma.worldNewsPost.findMany({
        orderBy: { publishedAt: "desc" },
        take: limit,
        include: { author: { select: { name: true, email: true } } },
      }),
    ]);

  const events: AdminLogEvent[] = [
    ...revisions.map((revision) => {
      const fields = changedFields(revision.previousValue, revision.newValue);
      return {
        id: `revision-${revision.id}`,
        kind: "revision" as const,
        tone:
          revision.fieldType === "WIKI" || revision.fieldType === "ACTION"
            ? ("warning" as const)
            : ("accent" as const),
        title: revisionTitle(revision.fieldType),
        summary: `${revision.nation.name} was updated by ${formatActor(revision.changedByUser)}.`,
        actor: formatActor(revision.changedByUser),
        createdAt: revision.createdAt,
        href: `/lorecp/nations/${revision.nationId}`,
        search: `${revision.nation.name} ${revision.fieldType} ${formatActor(revision.changedByUser)} ${JSON.stringify(revision.previousValue)} ${JSON.stringify(revision.newValue)}`,
        details: fields
          .slice(0, 5)
          .flatMap((field) => [
            { label: `${field.label} before`, value: field.before },
            { label: `${field.label} after`, value: field.after },
          ]),
      };
    }),
    ...actionUpdates.map((update) => ({
      id: `action-update-${update.id}`,
      kind: "action_update" as const,
      tone: "warning" as const,
      title: `${update.action.nation.name} action update`,
      summary: `${update.action.type} update posted by ${formatActor(update.createdByUser)}.`,
      actor: formatActor(update.createdByUser),
      createdAt: update.createdAt,
      href: `/lorecp/actions`,
      search: `${update.action.nation.name} ${update.action.type} ${formatActor(update.createdByUser)} ${update.content}`,
      details: [
        { label: "Nation", value: update.action.nation.name },
        { label: "Action type", value: update.action.type },
        { label: "Update", value: summarizeValue(update.content) },
      ],
    })),
    ...notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      kind: "notification" as const,
      tone:
        notification.category === "MAIL" || notification.category === "SPIN_RESULT"
          ? ("warning" as const)
          : ("neutral" as const),
      title: notification.title,
      summary: notificationSummary(
        notification.category,
        notification.title,
        notification.body,
      ),
      actor: formatActor(notification.createdByUser),
      createdAt: notification.createdAt,
      href: notification.href ?? "/dashboard/notifications",
      search: `${notification.nation.name} ${notification.category} ${notification.title} ${notification.body} ${formatActor(notification.createdByUser)}`,
      details: [
        { label: "Nation", value: notification.nation.name },
        { label: "Category", value: alertCategoryLabel(notification.category) },
        { label: "Body", value: summarizeValue(notification.body) },
      ],
    })),
    ...newsPosts.map((post) => ({
      id: `news-${post.id}`,
      kind: "news" as const,
      tone: "accent" as const,
      title: `News published: ${post.title}`,
      summary: `${formatActor(post.author)} published a world news report.`,
      actor: formatActor(post.author),
      createdAt: post.publishedAt,
      href: "/newscp",
      search: `${post.title} ${post.summary} ${post.content} ${formatActor(post.author)}`,
      details: [
        { label: "Headline", value: post.title },
        { label: "Summary", value: summarizeValue(post.summary) },
        { label: "Source", value: post.sourceLabel ?? "Internal desk" },
      ],
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit);

  return {
    events,
    counts: {
      revisions: revisions.length,
      actionUpdates: actionUpdates.length,
      notifications: notifications.length,
      newsPosts: newsPosts.length,
    },
  };
}
