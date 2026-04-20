import type { Metadata } from "next";
import Link from "next/link";
import { ReactionKind } from "@prisma/client";
import {
  createForumThreadAction,
  toggleForumReactionAction,
} from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";

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
  LIKE: "Like",
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

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
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
        <Panel className="border-emerald-300/25 bg-emerald-300/8">
          <p className="text-xs font-bold uppercase text-emerald-100">
            Forum Status
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-3xl font-black text-zinc-50">
                {threads.length}
              </p>
              <p className="text-xs text-zinc-400">Threads</p>
            </div>
            <div>
              <p className="text-3xl font-black text-zinc-50">
                {threads.reduce((total, thread) => total + thread._count.posts, 0)}
              </p>
              <p className="text-xs text-zinc-400">Replies</p>
            </div>
          </div>
        </Panel>
      </header>

      <Panel className="bg-[color:var(--panel-strong)]/85">
        <h2 className="text-2xl font-bold text-zinc-50">Start a Thread</h2>
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
              placeholder="Open with the question, proposal, or report. BBCode works here."
              className="min-h-36 p-3 lg:col-span-2"
            />
            <button className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200 lg:col-span-2">
              Publish Thread
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

      <section className="grid gap-4">
        {threads.map((thread) => {
          const counts = reactionCounts(thread.reactions);
          const latestPost = thread.posts[0];
          return (
            <Panel
              key={thread.id}
              className={thread.isPinned ? "border-amber-300/35" : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isPinned ? <Badge tone="warning">Pinned</Badge> : null}
                    <Badge>{thread.category}</Badge>
                    <Badge>{thread._count.posts} replies</Badge>
                  </div>
                  <Link href={`/forums/${thread.slug}`}>
                    <h2 className="mt-3 text-2xl font-black text-zinc-50 hover:text-emerald-100">
                      {thread.title}
                    </h2>
                  </Link>
                  <p className="mt-2 text-xs text-zinc-500">
                    Started {thread.createdAt.toLocaleString("en-GB")} by{" "}
                    {thread.author.name ?? thread.author.email ?? "Community"}
                  </p>
                </div>
                <Link
                  href={`/forums/${thread.slug}`}
                  className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10"
                >
                  Open
                </Link>
              </div>

              <div className="mt-4 line-clamp-4">
                <WikiRenderer content={thread.body} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                {(Object.keys(reactionLabels) as ReactionKind[]).map((kind) => (
                  <form
                    key={kind}
                    action={toggleForumReactionAction.bind(null, thread.id)}
                  >
                    <input type="hidden" name="kind" value={kind} />
                    <button
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!user}
                    >
                      {reactionLabels[kind]} {counts[kind] ?? 0}
                    </button>
                  </form>
                ))}
              </div>

              {latestPost ? (
                <p className="mt-4 text-sm text-zinc-400">
                  Latest reply by{" "}
                  {latestPost.author.name ??
                    latestPost.author.email ??
                    "Community"}{" "}
                  on {latestPost.createdAt.toLocaleString("en-GB")}
                </p>
              ) : null}
            </Panel>
          );
        })}
        {threads.length === 0 ? (
          <Panel className="text-zinc-300">
            No forum threads yet. Start the first discussion.
          </Panel>
        ) : null}
      </section>
    </PageShell>
  );
}
