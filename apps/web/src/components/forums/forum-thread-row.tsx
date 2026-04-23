import Link from "next/link";
import { ReactionKind, Role } from "@prisma/client";
import {
  deleteForumThreadAction,
  toggleForumReactionAction,
  toggleForumThreadPinnedAction,
} from "@/app/actions";
import { Badge } from "@/components/ui/shell";
import { canModerateForums } from "@/lib/role-utils";

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

export function ForumThreadRow({
  thread,
  user,
}: {
  thread: {
    id: string;
    slug: string;
    title: string;
    category: string;
    isPinned: boolean;
    createdAt: Date;
    author: { name: string | null; email: string | null };
    reactions: Array<{ kind: ReactionKind; userId: string }>;
    posts: Array<{
      createdAt: Date;
      author: { name: string | null; email: string | null };
    }>;
    _count: { posts: number };
  };
  user: {
    id: string;
    role: Role;
    roles?: Role[] | null;
  } | null;
}) {
  const counts = reactionCounts(thread.reactions);
  const latestPost = thread.posts[0];
  const canModerate = canModerateForums(user);

  return (
    <article className="grid gap-4 px-4 py-4 hover:bg-white/[0.03] sm:px-5 lg:grid-cols-[minmax(0,1fr)_96px_120px_minmax(180px,240px)] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {thread.isPinned ? <Badge tone="warning">Pinned</Badge> : null}
          <Badge>{thread.category}</Badge>
        </div>
        <Link href={`/forums/${thread.slug}`}>
          <h3 className="mt-2 text-xl font-black text-zinc-50 hover:text-emerald-100">
            {thread.title}
          </h3>
        </Link>
        <p className="mt-2 text-xs text-zinc-500">
          Started by {thread.author.name ?? thread.author.email ?? "Community"} on{" "}
          {thread.createdAt.toLocaleString("en-GB")}
        </p>
        {canModerate ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={toggleForumThreadPinnedAction.bind(null, thread.id)}>
              <button className="rounded-md border border-amber-300/50 px-2.5 py-1 text-xs font-bold text-amber-100 hover:bg-amber-300/10">
                {thread.isPinned ? "Unpin" : "Pin"}
              </button>
            </form>
            <form action={deleteForumThreadAction.bind(null, thread.id)}>
              <button className="rounded-md border border-rose-400/40 px-2.5 py-1 text-xs font-bold text-rose-100 hover:bg-rose-400/10">
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center lg:border-0 lg:bg-transparent">
        <p className="text-2xl font-black text-zinc-50">{thread._count.posts}</p>
        <p className="text-xs text-zinc-500 lg:hidden">Replies</p>
      </div>
      <div className="grid min-w-0 gap-2">
        <div className="text-center text-sm font-bold text-zinc-200">
          {thread.reactions.length} total
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {(Object.keys(reactionLabels) as ReactionKind[]).map((kind) => (
            <form
              key={kind}
              action={toggleForumReactionAction.bind(null, thread.id)}
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
          ))}
        </div>
      </div>
      <div className="min-w-0 text-sm leading-6 text-zinc-400">
        {latestPost ? (
          <>
            <p className="font-bold text-zinc-200">
              {latestPost.author.name ?? latestPost.author.email ?? "Community"}
            </p>
            <p>{latestPost.createdAt.toLocaleString("en-GB")}</p>
          </>
        ) : (
          <p>No replies yet</p>
        )}
      </div>
    </article>
  );
}
