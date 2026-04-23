import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoreActionStatus, Role } from "@prisma/client";
import { createNationSecretEntryAction } from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Private Nation Records",
  description: "Private completed-action records for nation leaders and staff.",
};

function canViewSecretPage(
  user: { id: string; role: Role; roles?: Role[] | null } | null,
  leaderUserId: string | null,
) {
  if (!user) return false;
  const roles = new Set([user.role, ...(user.roles ?? [])]);
  return (
    leaderUserId === user.id ||
    roles.has(Role.LORE) ||
    roles.has(Role.ADMIN) ||
    roles.has(Role.OWNER)
  );
}

export default async function NationSecretPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, nation] = await Promise.all([
    getCurrentUser(),
    getPrisma().nation.findUnique({
      where: { slug },
      include: {
        loreActions: {
          where: { status: LoreActionStatus.COMPLETED },
          orderBy: { updatedAt: "desc" },
          select: { id: true, type: true, action: true, outcome: true, updatedAt: true },
        },
        secretEntries: {
          orderBy: { createdAt: "desc" },
          include: {
            action: { select: { id: true, type: true, outcome: true } },
            createdByUser: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  if (!nation || !canViewSecretPage(user, nation.leaderUserId)) notFound();

  return (
    <PageShell className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Badge tone="warning">Private Nation Page</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            {nation.name} Secret Records
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Store staff-visible and leader-visible notes for completed actions,
            including screenshots of comments, DMs, spreadsheets, or outcomes.
          </p>
        </div>
        <Link
          href={`/nations/${nation.slug}`}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
        >
          Public profile
        </Link>
      </header>

      <Panel>
        <Badge tone="accent">Add Record</Badge>
        <form
          action={createNationSecretEntryAction.bind(null, nation.id)}
          className="mt-4 grid gap-4"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="grid gap-2 text-sm font-semibold text-zinc-200">
              Title
              <input
                name="title"
                required
                minLength={3}
                maxLength={160}
                placeholder="Screenshot proof, final calculation, private context"
                className="min-h-11 px-3"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-200">
              Completed action
              <select name="actionId" className="min-h-11 px-3">
                <option value="">General note</option>
                {nation.loreActions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.type} - {action.updatedAt.toLocaleDateString("en-GB")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-zinc-200">
            Private details
            <textarea
              name="content"
              required
              maxLength={8000}
              placeholder="Record what happened, where proof came from, and anything staff should remember when reviewing this completed action."
              className="min-h-36 p-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-200">
            Screenshot upload
            <input
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="min-h-11 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <button className="w-fit rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800">
            Save Private Record
          </button>
        </form>
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Stored Records</h2>
          <Badge>{nation.secretEntries.length}</Badge>
        </div>
        {nation.secretEntries.map((entry) => (
          <Panel key={entry.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warning">Private</Badge>
                  {entry.action ? <Badge>{entry.action.type}</Badge> : null}
                </div>
                <h3 className="mt-3 text-2xl font-bold text-zinc-50">
                  {entry.title}
                </h3>
              </div>
              <p className="text-sm text-zinc-500">
                {entry.createdAt.toLocaleString("en-GB")}
              </p>
            </div>
            <div className="mt-4">
              <WikiRenderer content={entry.content} />
            </div>
            {entry.action?.outcome ? (
              <div className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-900/10 p-3">
                <p className="text-xs font-bold uppercase text-emerald-100">
                  Linked outcome
                </p>
                <div className="mt-2">
                  <WikiRenderer content={entry.action.outcome} />
                </div>
              </div>
            ) : null}
            {entry.screenshotImage ? (
              <div className="relative mt-4 aspect-video max-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <Image
                  src={entry.screenshotImage}
                  alt={`${entry.title} screenshot`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="object-contain"
                />
              </div>
            ) : null}
            <p className="mt-4 text-xs text-zinc-500">
              Added by {entry.createdByUser?.name ?? entry.createdByUser?.email ?? "Unknown user"}
            </p>
          </Panel>
        ))}
        {nation.secretEntries.length === 0 ? (
          <Panel className="text-zinc-300">
            No private records have been saved for this nation yet.
          </Panel>
        ) : null}
      </section>
    </PageShell>
  );
}
