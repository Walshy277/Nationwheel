import type { Metadata } from "next";
import Link from "next/link";
import { ForumNav } from "@/components/forums/forum-nav";
import { ForumThreadRow } from "@/components/forums/forum-thread-row";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { forumBoards } from "@/lib/forums";
import { getPrisma } from "@/lib/prisma";
import { canModerateForums } from "@/lib/role-utils";

export const metadata: Metadata = {
  title: "Forums",
  description: "Discuss Nation Wheel canon, diplomacy, news, and strategy.",
  alternates: { canonical: "/forums" },
};

export default async function ForumsPage() {
  const user = await getCurrentUser();
  const canModerate = canModerateForums(user);
  const threads = await getPrisma().forumThread.findMany({
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
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
  });

  const boardSummaries = forumBoards.map((board) => {
    const boardThreads = threads.filter((thread) => thread.category === board.name);
    const latestThread = boardThreads[0] ?? null;
    const replies = boardThreads.reduce(
      (sum, thread) => sum + thread._count.posts,
      0,
    );

    return {
      ...board,
      threadCount: boardThreads.length,
      replyCount: replies,
      latestThread,
    };
  });

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <Badge tone="accent">Forums</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Nation Wheel Boards
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            A cleaner board index for canon talk, diplomacy, trade, news, and
            support. Pick a board, then drill into threads and moderation from
            there.
          </p>
          <div className="mt-5">
            <ForumNav user={user} />
          </div>
        </div>
        <Panel className="grid gap-3 border-emerald-300/20 bg-emerald-900/8">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
            Forum Tools
          </p>
          <Link
            href="/forums/new"
            className="rounded-lg bg-emerald-900 px-4 py-3 text-center font-bold text-emerald-50 hover:bg-emerald-800"
          >
            Start New Topic
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Boards</p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {boardSummaries.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Threads</p>
              <p className="mt-1 text-2xl font-black text-zinc-50">
                {threads.length}
              </p>
            </div>
          </div>
          {canModerate ? (
            <Badge tone="warning">Staff moderation enabled</Badge>
          ) : null}
        </Panel>
      </header>

      <section className="grid gap-4">
        {boardSummaries.map((board) => (
          <Panel
            key={board.slug}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_260px] lg:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">Board</Badge>
                <Badge>{board.threadCount} topics</Badge>
                <Badge>{board.replyCount} replies</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-black text-zinc-50">
                {board.name}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                {board.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/forums/boards/${board.slug}`}
                  className="rounded-lg border border-emerald-300/70 px-4 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
                >
                  Open Board
                </Link>
                <Link
                  href={`/forums/new?board=${board.slug}`}
                  className="rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-zinc-100 hover:bg-white/5"
                >
                  New Topic
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Latest Activity
              </p>
              {board.latestThread ? (
                <>
                  <Link
                    href={`/forums/${board.latestThread.slug}`}
                    className="mt-3 block text-lg font-bold text-zinc-50 hover:text-emerald-100"
                  >
                    {board.latestThread.title}
                  </Link>
                  <p className="mt-2 text-xs text-zinc-500">
                    {board.latestThread.updatedAt.toLocaleString("en-GB")}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">No topics yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Board Snapshot
              </p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Topics</span>
                  <span className="font-bold text-zinc-100">{board.threadCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Replies</span>
                  <span className="font-bold text-zinc-100">{board.replyCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Pinned</span>
                  <span className="font-bold text-zinc-100">
                    {threads.filter(
                      (thread) => thread.category === board.name && thread.isPinned,
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </section>

      <Panel className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Latest Threads
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-50">
              Recent activity across every board
            </h2>
          </div>
          <Badge>{threads.length}</Badge>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_96px_120px_240px] border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 lg:grid">
          <div>Topic</div>
          <div className="text-center">Replies</div>
          <div className="text-center">Reactions</div>
          <div>Latest</div>
        </div>
        <div className="divide-y divide-white/10">
          {threads.slice(0, 8).map((thread) => (
            <ForumThreadRow key={thread.id} thread={thread} user={user} />
          ))}
          {threads.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-300">
              No forum threads yet.
            </div>
          ) : null}
        </div>
      </Panel>
    </PageShell>
  );
}
