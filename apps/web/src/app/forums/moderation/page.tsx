import type { Metadata } from "next";
import Link from "next/link";
import { Role } from "@prisma/client";
import {
  deleteForumPostAction,
  deleteForumThreadAction,
  toggleForumThreadPinnedAction,
} from "@/app/actions";
import { ForumNav } from "@/components/forums/forum-nav";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { forumBoardHref, forumBoardFromCategory } from "@/lib/forums";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Forum Moderation",
  description: "Staff forum queue for Nation Wheel boards.",
  alternates: { canonical: "/forums/moderation" },
};

export default async function ForumModerationPage() {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  const user = await getCurrentUser();
  const [threads, latestPosts] = await Promise.all([
    getPrisma().forumThread.findMany({
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 20,
      include: {
        author: { select: { name: true, email: true } },
        _count: { select: { posts: true, reactions: true } },
      },
    }),
    getPrisma().forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { name: true, email: true } },
        thread: { select: { id: true, slug: true, title: true, category: true } },
      },
    }),
  ]);

  const pinnedCount = threads.filter((thread) => thread.isPinned).length;
  const quietThreads = threads.filter((thread) => thread._count.posts === 0).length;

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <Badge tone="warning">Staff Moderation</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Forum Control Desk
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Moderate active threads, pin important topics, and remove posts
            without leaving the forum workspace.
          </p>
          <div className="mt-5">
            <ForumNav user={user} />
          </div>
        </div>
        <Panel className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-bold uppercase text-zinc-500">Threads</p>
            <p className="mt-1 text-2xl font-black text-zinc-50">{threads.length}</p>
          </div>
          <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">
            <p className="text-xs font-bold uppercase text-amber-100">Pinned</p>
            <p className="mt-1 text-2xl font-black text-amber-50">{pinnedCount}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-bold uppercase text-zinc-500">No Replies</p>
            <p className="mt-1 text-2xl font-black text-zinc-50">{quietThreads}</p>
          </div>
        </Panel>
      </header>

      <Panel className="p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
            Thread Queue
          </p>
          <h2 className="mt-1 text-2xl font-black text-zinc-50">
            Open moderation actions
          </h2>
        </div>
        <div className="divide-y divide-white/10">
          {threads.map((thread) => {
            const board = forumBoardFromCategory(thread.category);
            return (
              <article
                key={thread.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_220px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isPinned ? <Badge tone="warning">Pinned</Badge> : null}
                    <Badge>{thread.category}</Badge>
                    <Badge>{thread._count.posts} replies</Badge>
                    <Badge>{thread._count.reactions} reactions</Badge>
                  </div>
                  <Link
                    href={`/forums/${thread.slug}`}
                    className="mt-3 block text-xl font-black text-zinc-50 hover:text-emerald-100"
                  >
                    {thread.title}
                  </Link>
                  <p className="mt-2 text-sm text-zinc-400">
                    Started by {thread.author.name ?? thread.author.email ?? "Community"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Updated {thread.updatedAt.toLocaleString("en-GB")} in{" "}
                    <Link
                      href={forumBoardHref(thread.category)}
                      className="text-emerald-100 hover:text-emerald-200"
                    >
                      {board?.name ?? thread.category}
                    </Link>
                  </p>
                </div>
                <div className="grid content-start gap-2">
                  <form action={toggleForumThreadPinnedAction.bind(null, thread.id)}>
                    <button className="w-full rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">
                      {thread.isPinned ? "Unpin Thread" : "Pin Thread"}
                    </button>
                  </form>
                  <Link
                    href={`/forums/${thread.slug}`}
                    className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-bold text-zinc-100 hover:bg-white/5"
                  >
                    Open Thread
                  </Link>
                  <form action={deleteForumThreadAction.bind(null, thread.id)}>
                    <button className="w-full rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-400/10">
                      Delete Thread
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
            Recent Posts
          </p>
          <h2 className="mt-1 text-2xl font-black text-zinc-50">
            Latest replies across the boards
          </h2>
        </div>
        <div className="divide-y divide-white/10">
          {latestPosts.map((post) => (
            <article
              key={post.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_180px]"
            >
              <div className="min-w-0">
                <Link
                  href={`/forums/${post.thread.slug}`}
                  className="text-lg font-bold text-zinc-50 hover:text-emerald-100"
                >
                  {post.thread.title}
                </Link>
                <p className="mt-2 text-sm text-zinc-400">
                  {post.author.name ?? post.author.email ?? "Community"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-300">
                  {post.body}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {post.createdAt.toLocaleString("en-GB")}
                </p>
              </div>
              <div className="grid content-start gap-2">
                <Link
                  href={`/forums/${post.thread.slug}`}
                  className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-bold text-zinc-100 hover:bg-white/5"
                >
                  Open Context
                </Link>
                <form action={deleteForumPostAction.bind(null, post.id)}>
                  <button className="w-full rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-400/10">
                    Delete Post
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
