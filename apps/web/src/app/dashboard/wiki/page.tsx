import Link from "next/link";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import {
  updateLeaderNameAction,
  updateNationFlagAction,
  updateWikiAction,
} from "@/app/actions";
import { PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

export default async function DashboardWikiPage() {
  const user = await requirePageUser();

  const nation = await getPrisma().nation.findFirst({
    where: { leaderUserId: user.id },
    include: { wiki: true },
    orderBy: { name: "asc" },
  });

  if (!nation) {
    return (
      <PageShell>
        <Panel>
          <div className="text-xs font-bold uppercase text-emerald-200">
            Nation Control
          </div>
          <h1 className="mt-3 text-3xl font-black text-zinc-50">
            No Nation Linked
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Your account currently has read-only access. Ask lore team or an
            admin to link your account to a nation to become its leader.
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

  return (
    <PageShell>
      <Panel>
        <div className="mb-5">
          <div className="text-xs font-bold uppercase text-emerald-200">
            Nation Control
          </div>
          <h1 className="mt-3 text-3xl font-black text-zinc-50">
            Manage {nation.name}
          </h1>
          <p className="mt-2 text-zinc-400">
            As the linked nation controller, you can update the fictional leader
            name, the flag, and your nation wiki. Canon stats remain staff-only.
          </p>
        </div>
        <div className="grid gap-5">
          <form
            action={updateLeaderNameAction.bind(null, nation.id)}
            className="rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <input type="hidden" name="returnPath" value="/dashboard/wiki" />
            <h2 className="text-lg font-bold text-zinc-50">Leader Name</h2>
            <p className="mt-1 text-sm text-zinc-400">
              This is the fictional name shown publicly on the nation page. It
              does not change the linked Discord account controlling the nation.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                name="leaderName"
                required
                defaultValue={nation.leaderName ?? ""}
                placeholder="Enter the current leader name"
                className="min-w-[320px] rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-zinc-100"
              />
              <button className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10">
                Save Leader Name
              </button>
            </div>
          </form>

          <form
            action={updateNationFlagAction.bind(null, nation.id)}
            className="rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <input type="hidden" name="returnPath" value="/dashboard/wiki" />
            <h2 className="text-lg font-bold text-zinc-50">Profile Picture</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Upload a small image to show as your nation profile picture.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                name="flag"
                type="file"
                accept="image/*"
                className="px-3 py-2 text-sm text-zinc-100"
              />
              <button className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10">
                Save Profile Picture
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
      </Panel>
    </PageShell>
  );
}
