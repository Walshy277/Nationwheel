import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createForumThreadAction } from "@/app/actions";
import { ForumNav } from "@/components/forums/forum-nav";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { forumBoards } from "@/lib/forums";

export const metadata: Metadata = {
  title: "New Forum Topic",
  description: "Create a new Nation Wheel forum topic.",
  alternates: { canonical: "/forums/new" },
};

export default async function NewForumTopicPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { board } = await searchParams;
  const selectedBoard = forumBoards.find((item) => item.slug === board);

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 border-b border-white/10 pb-6">
        <Link
          href={selectedBoard ? `/forums/boards/${selectedBoard.slug}` : "/forums"}
          className="text-sm font-bold text-emerald-100 hover:text-emerald-200"
        >
          Back to forums
        </Link>
        <div>
          <Badge tone="accent">New Topic</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Start a Forum Thread
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Choose the board, write the opening post, and attach an image if the
            thread needs one.
          </p>
          <div className="mt-5">
            <ForumNav user={user} />
          </div>
        </div>
      </header>

      <Panel className="bg-[color:var(--panel-strong)]/90">
        <form
          action={createForumThreadAction}
          className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
        >
          <label className="grid gap-2 text-sm font-bold text-zinc-100">
            Board
            <select
              name="category"
              required
              defaultValue={selectedBoard?.name ?? forumBoards[0]?.name}
              className="px-3 py-2"
            >
              {forumBoards.map((boardItem) => (
                <option key={boardItem.slug} value={boardItem.name}>
                  {boardItem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-100">
            Title
            <input
              name="title"
              required
              maxLength={140}
              placeholder="Thread title"
              className="px-3 py-2"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-100 xl:col-span-2">
            Opening Post
            <textarea
              name="body"
              required
              maxLength={8000}
              placeholder="Opening post. BBCode and markdown-style images are supported."
              className="min-h-48 p-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-100 xl:col-span-2">
            Optional Image
            <input
              name="imageUrl"
              type="url"
              placeholder="https:// optional thread image"
              className="px-3 py-2"
            />
          </label>
          <div className="flex flex-wrap gap-3 xl:col-span-2">
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
              Publish Topic
            </button>
            <Link
              href={selectedBoard ? `/forums/boards/${selectedBoard.slug}` : "/forums"}
              className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Panel>
    </PageShell>
  );
}
