import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { hasDatabase } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "World News",
  description: "Read Nation Wheel world news, reports, and journalist updates.",
  alternates: { canonical: "/news" },
};

export default async function WorldNewsPage() {
  const posts = hasDatabase()
    ? await getPrisma().worldNewsPost.findMany({
        orderBy: { publishedAt: "desc" },
        take: 30,
        include: { author: { select: { name: true, email: true } } },
      })
    : [];

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">World News</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-50">
          World News
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Reports from the world stage, published by journalists and staff.
        </p>
      </div>

      <div className="grid gap-5">
        {posts.map((post) => (
          <Panel key={post.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  {post.publishedAt.toLocaleString("en-GB")}
                </p>
                <h2 className="mt-2 break-words text-2xl font-black text-zinc-50">
                  {post.title}
                </h2>
              </div>
              <Badge tone="warning">Report</Badge>
            </div>
            <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-300">
              {post.summary}
            </p>
            <div className="mt-5 border-t border-white/10 pt-5">
              <WikiRenderer content={post.content} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
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
        {posts.length === 0 ? (
          <Panel>
            <h2 className="text-2xl font-bold text-zinc-50">
              No reports published yet.
            </h2>
            <p className="mt-3 text-zinc-300">
              Journalist posts will appear here once the newsroom starts
              publishing.
            </p>
          </Panel>
        ) : null}
      </div>
    </PageShell>
  );
}
