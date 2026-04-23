import type { Metadata } from "next";
import Link from "next/link";
import { GlobalSearchForm } from "@/components/search/global-search-form";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import {
  allPublicDirectoryLinks,
  allStaffDirectoryLinks,
  dashboardDirectoryLinks,
} from "@/lib/site-directory";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Nation Wheel pages, nations, actions, news, and forums.",
  alternates: { canonical: "/search" },
};

function normalizeQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = normalizeQuery((await searchParams).q).trim();
  const directoryLinks = [
    ...allPublicDirectoryLinks,
    ...dashboardDirectoryLinks,
    ...allStaffDirectoryLinks,
    { href: "/search", label: "Search", detail: "Search everywhere." },
  ];
  const matchingPages = query
    ? directoryLinks.filter((link) =>
        `${link.label} ${link.detail} ${link.href}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : directoryLinks.slice(0, 8);

  const [nations, actions, news, forums] = query
    ? await Promise.all([
        getPrisma().nation.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { government: { contains: query, mode: "insensitive" } },
              { economy: { contains: query, mode: "insensitive" } },
              { military: { contains: query, mode: "insensitive" } },
              { overview: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          orderBy: { name: "asc" },
          select: { name: true, slug: true, government: true },
        }),
        getPrisma().loreAction.findMany({
          where: {
            OR: [
              { type: { contains: query, mode: "insensitive" } },
              { action: { contains: query, mode: "insensitive" } },
              { outcome: { contains: query, mode: "insensitive" } },
              { nation: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 10,
          orderBy: { updatedAt: "desc" },
          include: { nation: { select: { name: true } } },
        }),
        getPrisma().worldNewsPost.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { publishedAt: "desc" },
          select: { title: true, summary: true, publishedAt: true },
        }),
        getPrisma().forumThread.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { updatedAt: "desc" },
          select: { title: true, slug: true, category: true },
        }),
      ])
    : [[], [], [], []];

  return (
    <PageShell className="grid gap-6">
      <header>
        <Badge tone="accent">Search</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Search Everywhere
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Search pages, nations, actions, news reports, and forum threads from
          one place.
        </p>
      </header>

      <Panel>
        <GlobalSearchForm initialQuery={query} />
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <Badge>Pages</Badge>
          <div className="mt-4 grid gap-2">
            {matchingPages.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50"
              >
                <span className="block font-bold text-zinc-50">
                  {link.label}
                </span>
                <span className="mt-1 block text-sm text-zinc-400">
                  {link.detail}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <Badge tone="accent">Nations</Badge>
          <div className="mt-4 grid gap-2">
            {nations.map((nation) => (
              <Link
                key={nation.slug}
                href={`/nations/${nation.slug}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50"
              >
                <span className="font-bold text-zinc-50">{nation.name}</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  {nation.government}
                </span>
              </Link>
            ))}
            {query && nations.length === 0 ? (
              <p className="text-sm text-zinc-400">No nations found.</p>
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <Badge tone="warning">Actions</Badge>
          <div className="mt-4 grid gap-2">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={`/actions/${action.id}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50"
              >
                <span className="font-bold text-zinc-50">
                  {action.nation.name} - {action.type}
                </span>
                <span className="mt-1 line-clamp-2 block text-sm text-zinc-400">
                  {action.action}
                </span>
              </Link>
            ))}
            {query && actions.length === 0 ? (
              <p className="text-sm text-zinc-400">No actions found.</p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <Badge>News</Badge>
          <div className="mt-4 grid gap-2">
            {news.map((post) => (
              <Link
                key={`${post.title}-${post.publishedAt.toISOString()}`}
                href="/news"
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50"
              >
                <span className="font-bold text-zinc-50">{post.title}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-zinc-400">
                  {post.summary}
                </span>
              </Link>
            ))}
            {query && news.length === 0 ? (
              <p className="text-sm text-zinc-400">No news found.</p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <Badge>Forums</Badge>
          <div className="mt-4 grid gap-2">
            {forums.map((thread) => (
              <Link
                key={thread.slug}
                href={`/forums/${thread.slug}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50"
              >
                <span className="font-bold text-zinc-50">{thread.title}</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  {thread.category}
                </span>
              </Link>
            ))}
            {query && forums.length === 0 ? (
              <p className="text-sm text-zinc-400">No forum threads found.</p>
            ) : null}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
