import { Role } from "@prisma/client";
import { createWorldNewsPostAction } from "@/app/actions";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { hasDatabase, newsCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export default async function NewsControlPage() {
  await requirePageRole([
    Role.JOURNALIST,
    Role.LORE,
    Role.ADMIN,
    Role.OWNER,
  ]);

  const posts = hasDatabase()
    ? await getPrisma().worldNewsPost.findMany({
        orderBy: { publishedAt: "desc" },
        take: 10,
        include: { author: { select: { name: true, email: true } } },
      })
    : [];

  return (
    <ControlLayout title="NewsCP" links={newsCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <Badge tone="warning">Journalist Desk</Badge>
          <h1 className="mt-4 text-3xl font-black text-zinc-50">
            Publish World News
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Journalists can publish world-stage reports for everyone to read.
            Use the body for the full article and keep the summary short.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-zinc-50">New Report</h2>
          <form action={createWorldNewsPostAction} className="mt-5 grid gap-3">
            <input
              name="title"
              required
              maxLength={160}
              placeholder="Headline"
              className="px-3 py-2"
            />
            <textarea
              name="summary"
              required
              maxLength={280}
              placeholder="Short front-page summary"
              className="min-h-24 p-3"
            />
            <textarea
              name="content"
              required
              placeholder="Full report. Markdown headings and lists are supported."
              className="min-h-[360px] p-4 font-mono text-sm leading-7"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="sourceLabel"
                placeholder="Source label, optional"
                className="px-3 py-2"
              />
              <input
                name="sourceUrl"
                type="url"
                placeholder="https:// source link, optional"
                className="px-3 py-2"
              />
            </div>
            <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-zinc-950 hover:bg-amber-200">
              Publish Report
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Recent Reports</h2>
            <Badge tone="accent">{posts.length}</Badge>
          </div>
          <div className="grid gap-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <h3 className="text-lg font-bold text-zinc-50">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {post.summary}
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  {post.publishedAt.toLocaleString("en-GB")} by{" "}
                  {post.author?.name ?? post.author?.email ?? "World News"}
                </p>
              </article>
            ))}
            {posts.length === 0 ? (
              <p className="text-sm text-zinc-400">No reports yet.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </ControlLayout>
  );
}
