import Link from "next/link";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import { updateNationFlagAction, updateWikiAction } from "@/app/actions";
import { PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

export default async function DashboardWikiPage() {
  const user = await requirePageUser();

  if (!user.nationId) {
    return (
      <PageShell>
        <Panel>
          <div className="text-xs font-bold uppercase text-emerald-200">
            Leader Wiki
          </div>
          <h1 className="mt-3 text-3xl font-black text-zinc-50">
            No Nation Assigned
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Ask an admin to assign your account to a nation before editing wiki
            lore.
          </p>
          <Link
            href="/nations"
            className="mt-5 inline-flex rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10"
          >
            Browse Nations
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const nation = await getPrisma().nation.findUnique({
    where: { id: user.nationId },
    include: { wiki: true },
  });

  return (
    <PageShell>
      <Panel>
        <div className="mb-5">
          <div className="text-xs font-bold uppercase text-emerald-200">
            Leader Wiki
          </div>
          <h1 className="mt-3 text-3xl font-black text-zinc-50">
            Edit {nation?.name ?? "Nation"} Lore
          </h1>
          <p className="mt-2 text-zinc-400">
            Write wiki-style history, diplomacy, culture, treaties, and current
            world context.
          </p>
        </div>
        {nation ? (
          <div className="grid gap-5">
            <form
              action={updateNationFlagAction.bind(null, nation.id)}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <h2 className="text-lg font-bold text-zinc-50">Flag</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Upload a small image for your nation profile.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  name="flag"
                  type="file"
                  accept="image/*"
                  className="px-3 py-2 text-sm text-zinc-100"
                />
                <button className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10">
                  Save Flag
                </button>
              </div>
            </form>

            <form
              action={updateWikiAction.bind(null, nation.id)}
              className="grid gap-4"
            >
              <textarea
                name="content"
                required
                className="min-h-[420px] w-full p-4 font-mono text-sm leading-7 text-zinc-100"
                defaultValue={
                  nation.wiki?.content ?? createNationWikiTemplate(nation)
                }
              />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200">
                  Save Lore
                </button>
                <Link
                  href={`/nations/${nation.slug}`}
                  className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
                >
                  Open Profile
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <p className="text-zinc-300">Assigned nation could not be found.</p>
        )}
      </Panel>
    </PageShell>
  );
}
