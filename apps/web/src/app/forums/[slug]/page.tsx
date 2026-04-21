import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactionKind } from "@prisma/client";
import {
  createForumPostAction,
  deleteForumPostAction,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!hasDatabase()) return { title: "Forum Thread" };
  const thread = await getPrisma().forumThread.findUnique({
    where: { slug },
    select: { title: true, body: true },
  });
  if (!thread) return { title: "Forum Thread" };
  return {
    title: thread.title,
    description: thread.body.slice(0, 150),
    alternates: { canonical: `/forums/${slug}` },
  };
}

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

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const canModerate = canModerateForums(user);
  if (!hasDatabase()) notFound();

  const thread = await getPrisma().forumThread.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, email: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
      reactions: { select: { kind: true, userId: true } },
    },
  });

  if (!thread) notFound();
  const counts = reactionCounts(thread.reactions);

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 border-b border-white/10 pb-6">
        <Link
          href="/forums"
          className="text-sm font-bold text-emerald-100 hover:text-emerald-200"
        >
          Back to forums
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="accent">Forum Thread</Badge>
          <Badge>{thread.category}</Badge>
          {thread.isPinned ? <Badge tone="warning">Pinned</Badge> : null}
          <Badge>{thread.posts.length} replies</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          {thread.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Started {thread.createdAt.toLocaleString("en-GB")} by{" "}
          {thread.author.name ?? thread.author.email ?? "Community"}
        </p>
        {canModerate ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={toggleForumThreadPinnedAction.bind(null, thread.id)}>
              <button className="rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">
                {thread.isPinned ? "Unpin Thread" : "Pin Thread"}
              </button>
            </form>
            <form action={deleteForumThreadAction.bind(null, thread.id)}>
              <button className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-400/10">
                Delete Thread
              </button>
            </form>
          </div>
        ) : null}
      </header>

      <Panel className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-black/25 p-4 lg:border-b-0 lg:border-r lg:p-5">
            <p className="text-sm font-black text-zinc-50">
              {thread.author.name ?? thread.author.email ?? "Community"}
            </p>
            <p className="mt-1 text-xs uppercase text-zinc-500">Topic author</p>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              <Badge>{thread.category}</Badge>
              <Badge>{thread.posts.length} replies</Badge>
            </div>
          </aside>
          <article className="p-4 sm:p-5">
            <div className="text-xs font-bold uppercase text-zinc-500">
              Opening Post
            </div>
            {thread.imageUrl ? (
              <ContentImage
                src={thread.imageUrl}
                alt={thread.title}
                className="mt-4 max-h-[420px]"
              />
            ) : null}
            <div className="mt-4">
              <WikiRenderer content={thread.body} />
            </div>
          </article>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/20 px-4 py-3 sm:px-5">
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
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Replies</h2>
          <Badge>{thread.posts.length}</Badge>
        </div>
        {thread.posts.map((post) => (
          <Panel key={post.id} className="overflow-hidden p-0">
            <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="border-b border-white/10 bg-black/25 p-4 lg:border-b-0 lg:border-r lg:p-5">
                <p className="text-sm font-black text-zinc-50">
                  {post.author.name ?? post.author.email ?? "Community"}
                </p>
                <p className="mt-1 text-xs uppercase text-zinc-500">Member</p>
              </aside>
              <article className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase text-zinc-500">
                    Reply
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {post.createdAt.toLocaleString("en-GB")}
                    </span>
                    {canModerate ? (
                      <form action={deleteForumPostAction.bind(null, post.id)}>
                        <button className="rounded-md border border-rose-400/40 px-2 py-1 text-xs font-bold text-rose-100 hover:bg-rose-400/10">
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  {post.imageUrl ? (
                    <ContentImage
                      src={post.imageUrl}
                      alt={`${thread.title} reply`}
                      className="mb-4 max-h-80"
                    />
                  ) : null}
                  <WikiRenderer content={post.body} />
                </div>
              </article>
            </div>
          </Panel>
        ))}
        {thread.posts.length === 0 ? (
          <Panel className="text-zinc-300">No replies yet.</Panel>
        ) : null}
      </section>

      <Panel className="bg-[color:var(--panel-strong)]/85">
        <h2 className="text-2xl font-bold text-zinc-50">Reply</h2>
        {user ? (
          <form
            action={createForumPostAction.bind(null, thread.id)}
            className="mt-5 grid gap-3"
          >
            <textarea
              name="body"
              required
              maxLength={8000}
              placeholder="Add a reply. BBCode works here."
              className="min-h-36 p-3"
            />
            <input
              name="imageUrl"
              type="url"
              placeholder="https:// optional reply image"
              className="px-3 py-2"
            />
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
              Post Reply
            </button>
          </form>
        ) : (
          <p className="mt-3 text-zinc-300">
            <Link href="/login" className="font-bold text-emerald-100">
              Sign in
            </Link>{" "}
            to reply.
          </p>
        )}
      </Panel>
    </PageShell>
  );
}
