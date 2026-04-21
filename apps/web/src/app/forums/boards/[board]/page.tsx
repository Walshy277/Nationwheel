import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumNav } from "@/components/forums/forum-nav";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { ForumThreadRow } from "@/components/forums/forum-thread-row";
import { getCurrentUser } from "@/lib/auth";
import { forumBoardBySlug, forumBoards } from "@/lib/forums";
import { getPrisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board: string }>;
}): Promise<Metadata> {
  const { board } = await params;
  const boardInfo = forumBoardBySlug(board);
  if (!boardInfo) return { title: "Forum Board" };
  return {
    title: boardInfo.name,
    description: boardInfo.description,
    alternates: { canonical: `/forums/boards/${boardInfo.slug}` },
  };
}

export default async function ForumBoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;
  const boardInfo = forumBoardBySlug(board);
  if (!boardInfo) notFound();

  const user = await getCurrentUser();
  const [threads, boardStats] = await Promise.all([
    getPrisma().forumThread.findMany({
      where: { category: boardInfo.name },
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
    }),
    getPrisma().forumThread.aggregate({
      where: { category: boardInfo.name },
      _count: { id: true },
    }),
  ]);

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <Link
            href="/forums"
            className="text-sm font-bold text-emerald-100 hover:text-emerald-200"
          >
            Back to forum index
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="accent">Board</Badge>
            <Badge>{boardInfo.name}</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            {boardInfo.name}
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            {boardInfo.description}
          </p>
          <div className="mt-5">
            <ForumNav user={user} />
          </div>
        </div>
        <Panel className="grid gap-3 border-emerald-300/20 bg-emerald-900/8">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
            Board Tools
          </p>
          <Link
            href={`/forums/new?board=${boardInfo.slug}`}
            className="rounded-lg bg-emerald-900 px-4 py-3 text-center font-bold text-emerald-50 hover:bg-emerald-800"
          >
            Start New Topic
          </Link>
          <p className="text-sm text-zinc-300">
            {boardStats._count.id} thread{boardStats._count.id === 1 ? "" : "s"} in this board.
          </p>
        </Panel>
      </header>

      <Panel className="p-0">
        <div className="hidden grid-cols-[minmax(0,1fr)_96px_120px_240px] border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 lg:grid">
          <div>Topic</div>
          <div className="text-center">Replies</div>
          <div className="text-center">Reactions</div>
          <div>Latest</div>
        </div>
        <div className="divide-y divide-white/10">
          {threads.map((thread) => (
            <ForumThreadRow key={thread.id} thread={thread} user={user} />
          ))}
          {threads.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-300">
              No topics in this board yet.
            </div>
          ) : null}
        </div>
      </Panel>

      <section className="grid gap-3 md:grid-cols-3">
        {forumBoards.map((otherBoard) => (
          <Link key={otherBoard.slug} href={`/forums/boards/${otherBoard.slug}`}>
            <Panel className="h-full bg-black/20 hover:border-emerald-300/70 hover:bg-[color:var(--panel-strong)]">
              <Badge tone={otherBoard.slug === boardInfo.slug ? "warning" : "neutral"}>
                {otherBoard.slug === boardInfo.slug ? "Current Board" : "Board"}
              </Badge>
              <h2 className="mt-4 text-xl font-bold text-zinc-50">
                {otherBoard.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {otherBoard.description}
              </p>
            </Panel>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
