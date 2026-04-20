import type { Metadata } from "next";
import Link from "next/link";
import { ReactionKind } from "@prisma/client";
import { toggleWorldNewsReactionAction } from "@/app/actions";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { getPublicContentPage } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "World News",
  description: "Read Nation Wheel world news, reports, and journalist updates.",
  alternates: { canonical: "/news" },
};

function announcementItems(content: string) {
  return content
    .split("\n")
    .map((line) =>
      line
        .replace(/^#+\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim(),
    )
    .filter((line) => line.length > 0 && line.toLowerCase() !== "announcements")
    .slice(0, 8);
}

function reactionCounts(reactions: Array<{ kind: ReactionKind }>) {
  return reactions.reduce(
    (counts, reaction) => ({
      ...counts,
      [reaction.kind]: (counts[reaction.kind] ?? 0) + 1,
    }),
    {} as Partial<Record<ReactionKind, number>>,
  );
}

function NewsReactions({
  postId,
  reactions,
  signedIn,
}: {
  postId: string;
  reactions: Array<{ kind: ReactionKind }>;
  signedIn: boolean;
}) {
  const counts = reactionCounts(reactions);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleWorldNewsReactionAction.bind(null, postId)}>
        <input type="hidden" name="kind" value={ReactionKind.LIKE} />
        <button
          className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-amber-300/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!signedIn}
        >
          👍 {counts.LIKE ?? 0}
        </button>
      </form>
    </div>
  );
}

export default async function WorldNewsPage() {
  const [posts, announcements, user] = await Promise.all([
    hasDatabase()
      ? getPrisma().worldNewsPost.findMany({
          orderBy: { publishedAt: "desc" },
          take: 30,
          include: {
            author: { select: { name: true, email: true } },
            reactions: { select: { kind: true, userId: true } },
          },
        })
      : [],
    getPublicContentPage("announcements"),
    getCurrentUser(),
  ]);
  const tickerItems = [
    ...announcementItems(announcements.content),
    ...posts.slice(0, 5).map((post) => post.title),
  ];
  const [leadPost, ...otherPosts] = posts;

  return (
    <PageShell className="grid gap-6">
      <header className="border-y border-white/15 py-6 text-center">
        <Badge tone="accent">World News</Badge>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-zinc-50 md:text-7xl">
          The Nation Wheel Gazette
        </h1>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
          Reports from the world stage
        </p>
      </header>

      {tickerItems.length ? (
        <div className="overflow-hidden rounded-lg border border-amber-300/30 bg-amber-300/10">
          <div className="flex min-w-max animate-[ticker_32s_linear_infinite] gap-8 px-4 py-3 text-sm font-bold uppercase tracking-wide text-amber-50">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`}>Breaking: {item}</span>
            ))}
          </div>
        </div>
      ) : null}

      {leadPost ? (
        <Panel className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <article className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Lead Report · {leadPost.publishedAt.toLocaleString("en-GB")}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-50 md:text-5xl">
              {leadPost.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-200">
              {leadPost.summary}
            </p>
            <div className="mt-6 border-t border-white/10 pt-6">
              <WikiRenderer content={leadPost.content} />
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Reader reaction
              </p>
              <NewsReactions
                postId={leadPost.id}
                reactions={leadPost.reactions}
                signedIn={Boolean(user)}
              />
              {!user ? (
                <p className="mt-3 text-sm text-zinc-400">
                  <Link href="/login" className="font-bold text-amber-100">
                    Sign in
                  </Link>{" "}
                  to react to reports.
                </p>
              ) : null}
            </div>
          </article>
          <aside className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-amber-100">
              Announcements
            </h3>
            <div className="mt-4">
              <WikiRenderer content={announcements.content} />
            </div>
            <Link
              href="/lorecp/pages/announcements"
              className="mt-5 inline-flex rounded-lg border border-amber-300/70 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10"
            >
              Edit Announcements
            </Link>
          </aside>
        </Panel>
      ) : (
        <Panel>
          <h2 className="text-2xl font-bold text-zinc-50">
            No reports published yet.
          </h2>
          <p className="mt-3 text-zinc-300">
            Journalist posts will appear here once the newsroom starts
            publishing.
          </p>
        </Panel>
      )}

      {otherPosts.length ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {otherPosts.map((post) => (
            <Panel key={post.id} className="grid content-start gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {post.publishedAt.toLocaleString("en-GB")}
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-zinc-50">
                  {post.title}
                </h2>
              </div>
              <Badge tone="warning">Report</Badge>
              <p className="text-base leading-7 text-zinc-300">
                {post.summary}
              </p>
              <details>
                <summary className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                  Read report
                </summary>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <WikiRenderer content={post.content} />
                </div>
              </details>
              <NewsReactions
                postId={post.id}
                reactions={post.reactions}
                signedIn={Boolean(user)}
              />
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span>
                  By {post.author?.name ?? post.author?.email ?? "World News"}
                </span>
                {post.sourceUrl ? (
                  <Link
                    href={post.sourceUrl}
                    className="font-semibold text-emerald-100 hover:text-emerald-200"
                  >
                    {post.sourceLabel ?? "Source"}
                  </Link>
                ) : post.sourceLabel ? (
                  <span>{post.sourceLabel}</span>
                ) : null}
              </div>
            </Panel>
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
