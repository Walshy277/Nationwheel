import type { Metadata } from "next";
import Link from "next/link";
import { ReactionKind } from "@prisma/client";
import {
  createForumThreadAction,
  deleteForumThreadAction,
  toggleForumReactionAction,
  toggleForumThreadPinnedAction,
} from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { ContentImage } from "@/components/ui/content-image";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { canModerateForums } from "@/lib/role-utils";

export const metadata: Metadata = {
  title: "Forums",
  description: "Discuss Nation Wheel canon, diplomacy, news, and strategy.",
  alternates: { canonical: "/forums" },
};

const categories = [
  "General",
  "Diplomacy",
  "Canon Actions",
  "Trade",
  "Newsroom",
  "Support",
] as const;

const reactionLabels: Record<ReactionKind, string> = {
  LIKE: "\uD83D\uDC4D",
  SUPPORT: "Support",
  CONCERN: "Concern",
  INSIGHT: "Insight",
};

function reactionCounts(reactions: Array<{ kind: ReactionKind }>) {
  return reactions.reduce(
    (counts, reaction) => ({
      ...counts,
      [reaction.kind]: (counts[reaction.kind] ?? 0) + 1,
    }),
    {} as Partial<Record<ReactionKind, number>>,
  );
}

export default async function ForumsPage() {
  const user = await getCurrentUser();
  const canModerate = canModerateForums(user);
  const threads = hasDatabase()
    ? await getPrisma().forumThread.findMany({
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        take: 60,
        include: {
          author: { select: { name: true, email: true } },
          posts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { author: { select: { name: true, email: true } } },
          },
          reactions: { select: { kind: true, userId: true } },
          _count: { select: { posts: true } },
        },
      })
    : [];
  const totalReplies = threads.reduce(
    (total, thread) => total + thread._count.posts,
    0,
  );
  const totalReactions = threads.reduce(
    (total, thread) => total + thread.reactions.length,
    0,
  );
  const groupedThreads = categories.map((category) => ({
    category,
    threads: threads.filter((thread) => thread.category === category),
  }));
  const uncategorizedThreads = threads.filter(
    (thread) =>
      !categories.includes(thread.category as (typeof categories)[number]),
  );

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
        <div>
          <Badge tone="accent">Forums</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Nation Wheel Forums
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Public discussion for canon questions, diplomacy, trade, news, and
            community support.
          </p>
        </div>
        <Panel className="grid gap-4 border-emerald-300/25 bg-emerald-900/8">
          <p className="text-xs font-bold uppercase text-emerald-100">
            Board Stats
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-3xl font-black text-zinc-50">
                {threads.length}
              </p>
              <p className="text-xs text-zinc-400">Threads</p>
            </div>
            <div>
              <p className="text-3xl font-black text-zinc-50">{totalReplies}</p>
              <p className="text-xs text-zinc-400">Replies</p>
            </div>
            <div>
              <p className="text-3xl font-black text-zinc-50">
                {totalReactions}
              </p>
              <p className="text-xs text-zinc-400">Reactions</p>
            </div>
          </div>
        </Panel>
      </header>

      <Panel className="bg-[color:var(--panel-strong)]/85" id="new-thread">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50">New Topic</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Start a board topic with a category, title, and opening post.
            </p>
          </div>
          <Badge tone={user ? "accent" : "neutral"}>
            {user ? "Signed in" : "Login required"}
          </Badge>
        </div>
        {user ? (
          <form
            action={createForumThreadAction}
            className="mt-5 grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]"
          >
            <select name="category" required className="px-3 py-2">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              name="title"
              required
              maxLength={140}
              placeholder="Thread title"
              className="px-3 py-2"
            />
            <textarea
              name="body"
              required
              maxLength={8000}
              placeholder="Opening post. BBCode works here."
              className="min-h-36 p-3 lg:col-span-2"
            />
            <input
              name="imageUrl"
              type="url"
              placeholder="https:// optional thread image"
              className="px-3 py-2 lg:col-span-2"
            />
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800 lg:col-span-2">
              Create Topic
            </button>
          </form>
        ) : (
          <p className="mt-3 text-zinc-300">
            <Link href="/login" className="font-bold text-emerald-100">
              Sign in
            </Link>{" "}
            to start a thread or react.
          </p>
        )}
      </Panel>

      <section className="grid gap-5">
        {[...groupedThreads, { category: "Other", threads: uncategorizedThreads }]
          .filter((group) => group.threads.length > 0 || group.category !== "Other")
          .map((group) => (
            <Panel key={group.category} className="p-0">
              <div className="rounded-t-lg border-b border-white/10 bg-black/30 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-zinc-50">
                      {group.category}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {group.threads.length} topic
                      {group.threads.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canModerate ? (
                      <Badge tone="warning">Moderation enabled</Badge>
                    ) : null}
                    <a
                      href="#new-thread"
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                    >
                      New Topic
                    </a>
                  </div>
                </div>
              </div>
              <div className="hidden grid-cols-[minmax(0,1fr)_96px_120px_240px] border-b border-white/10 px-5 py-2 text-xs font-bold uppercase text-zinc-500 lg:grid">
                <div>Topic</div>
                <div className="text-center">Replies</div>
                <div className="text-center">Reactions</div>
                <div>Latest</div>
              </div>
              <div className="divide-y divide-white/10">
                {group.threads.map((thread) => {
                  const counts = reactionCounts(thread.reactions);
                  const latestPost = thread.posts[0];
                  return (
                    <article
                      key={thread.id}
                      className="grid gap-4 px-4 py-4 hover:bg-white/[0.03] sm:px-5 lg:grid-cols-[minmax(0,1fr)_96px_120px_240px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {thread.isPinned ? (
                            <Badge tone="warning">Pinned</Badge>
                          ) : null}
                          <Badge>{thread.category}</Badge>
                        </div>
                        <Link href={`/forums/${thread.slug}`}>
                          <h3 className="mt-2 text-xl font-black text-zinc-50 hover:text-emerald-100">
                            {thread.title}
                          </h3>
                        </Link>
                        <p className="mt-2 text-xs text-zinc-500">
                          Started by{" "}
                          {thread.author.name ??
                            thread.author.email ??
                            "Community"}{" "}
                          on {thread.createdAt.toLocaleString("en-GB")}
                        </p>
                        {thread.imageUrl ? (
                          <div className="mt-3 max-w-sm">
                            <ContentImage
                              src={thread.imageUrl}
                              alt={thread.title}
                              className="max-h-44"
                            />
                          </div>
                        ) : null}
                        <div className="mt-3 line-clamp-2 text-sm">
                          <WikiRenderer content={thread.body} />
                        </div>
                        {canModerate ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <form
                              action={toggleForumThreadPinnedAction.bind(
                                null,
                                thread.id,
                              )}
                            >
                              <button className="rounded-md border border-amber-300/50 px-2.5 py-1 text-xs font-bold text-amber-100 hover:bg-amber-300/10">
                                {thread.isPinned ? "Unpin" : "Pin"}
                              </button>
                            </form>
                            <form
                              action={deleteForumThreadAction.bind(
                                null,
                                thread.id,
                              )}
                            >
                              <button className="rounded-md border border-rose-400/40 px-2.5 py-1 text-xs font-bold text-rose-100 hover:bg-rose-400/10">
                                Delete
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center lg:border-0 lg:bg-transparent">
                        <p className="text-2xl font-black text-zinc-50">
                          {thread._count.posts}
                        </p>
                        <p className="text-xs text-zinc-500 lg:hidden">
                          Replies
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="text-center text-sm font-bold text-zinc-200">
                          {thread.reactions.length} total
                        </div>
                        <div className="flex flex-wrap justify-center gap-1">
                          {(Object.keys(reactionLabels) as ReactionKind[]).map(
                            (kind) => (
                              <form
                                key={kind}
                                action={toggleForumReactionAction.bind(
                                  null,
                                  thread.id,
                                )}
                              >
                                <input type="hidden" name="kind" value={kind} />
                                <button
                                  title={reactionLabels[kind]}
                                  className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-zinc-100 hover:border-emerald-300/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!user}
                                >
                                  {reactionLabels[kind]} {counts[kind] ?? 0}
                                </button>
                              </form>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="text-sm leading-6 text-zinc-400">
                        {latestPost ? (
                          <>
                            <p className="font-bold text-zinc-200">
                              {latestPost.author.name ??
                                latestPost.author.email ??
                                "Community"}
                            </p>
                            <p>{latestPost.createdAt.toLocaleString("en-GB")}</p>
                          </>
                        ) : (
                          <p>No replies yet</p>
                        )}
                      </div>
                    </article>
                  );
                })}
                {group.threads.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-zinc-300 sm:px-5">
                    No topics in this board yet.
                  </div>
                ) : null}
              </div>
            </Panel>
          ))}
      </section>
    </PageShell>
  );
}
