import Image from "next/image";
import Link from "next/link";
import { createNationOverview, type NationSummary } from "@nation-wheel/shared";
import {
  updateNationOverviewAction,
  updateNationStatsAction,
} from "@/app/actions";
import { NationMap } from "@/components/map/nation-map";
import { NationStatGrid } from "@/components/nation/nation-stat-grid";
import { NationTimeline } from "@/components/nation/nation-timeline";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, Panel } from "@/components/ui/shell";

export function NationProfile({
  nation,
  wiki,
  canEditStats = false,
  isAdmin = false,
}: {
  nation: NationSummary;
  wiki: string;
  canEditStats?: boolean;
  isAdmin?: boolean;
}) {
  const overview = createNationOverview(nation);

  return (
    <div className="grid gap-6">
      <Panel className="grid gap-6 lg:grid-cols-[minmax(160px,220px)_1fr] lg:items-center">
        {nation.flagImage ? (
          <div className="relative aspect-[3/2] w-full max-w-[240px] overflow-hidden rounded-lg border border-white/10 bg-black/30 p-2">
            <Image
              src={nation.flagImage}
              alt={`${nation.name} flag`}
              fill
              unoptimized
              sizes="(min-width: 1024px) 220px, 70vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="grid aspect-[3/2] w-full max-w-[240px] place-items-center rounded-lg border border-emerald-300/35 bg-emerald-300/10 text-4xl font-black text-emerald-100">
            {nation.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="accent">Nation Profile</Badge>
            <Badge>
              {nation.leaderName
                ? `Leader: ${nation.leaderName}`
                : "Leader unassigned"}
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-50">
            {nation.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            {nation.government} with a size of {nation.people}.
          </p>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Overview</h2>
            {nation.overview ? (
              <Badge tone="accent">Staff Curated</Badge>
            ) : (
              <Badge>Generated</Badge>
            )}
          </div>
          <p className="leading-8 text-zinc-300">{overview}</p>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold text-zinc-50">Stats</h2>
          <NationStatGrid nation={nation} />
        </Panel>
      </div>

      {canEditStats ? (
        <Panel>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="warning">Staff Tools</Badge>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">
                Edit This Nation
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Lore and admin staff can tune the public overview and update
                stats directly from this profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/lorecp/nations/${nation.id}`}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
              >
                Full Lore Review
              </Link>
              {isAdmin ? (
                <Link
                  href="/admincp/users"
                  className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10"
                >
                  Manage Roles
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
            <form
              action={updateNationOverviewAction.bind(null, nation.id)}
              className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <h3 className="text-lg font-bold text-zinc-50">
                Public Overview
              </h3>
              <p className="text-sm leading-6 text-zinc-400">
                Write a profile that feels specific to this nation. Use the
                stats as evidence, not a script.
              </p>
              <textarea
                name="overview"
                required
                minLength={80}
                maxLength={2500}
                defaultValue={overview}
                className="min-h-64 p-3 text-sm leading-7"
              />
              <button className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-zinc-950 hover:bg-amber-200">
                Save Overview
              </button>
            </form>

            <form
              action={updateNationStatsAction.bind(null, nation.id)}
              className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 md:grid-cols-2"
            >
              <input type="hidden" name="slug" value={nation.slug} />
              <input
                type="hidden"
                name="returnPath"
                value={`/nations/${nation.slug}`}
              />
              <h3 className="text-lg font-bold text-zinc-50 md:col-span-2">
                Structured Stats
              </h3>
              <input name="name" required defaultValue={nation.name} className="px-3 py-2" />
              <input name="people" required defaultValue={nation.people} className="px-3 py-2" />
              <input
                name="government"
                required
                defaultValue={nation.government}
                className="px-3 py-2"
              />
              <input name="gdp" required defaultValue={nation.gdp} className="px-3 py-2" />
              <input
                name="economy"
                required
                defaultValue={nation.economy}
                className="px-3 py-2"
              />
              <input
                name="military"
                required
                defaultValue={nation.military}
                className="px-3 py-2"
              />
              <input name="area" defaultValue={nation.area ?? ""} placeholder="Area" className="px-3 py-2" />
              <input name="hdi" defaultValue={nation.hdi ?? ""} placeholder="HDI" className="px-3 py-2" />
              <input
                name="geoPoliticalStatus"
                defaultValue={nation.geoPoliticalStatus ?? ""}
                placeholder="Geo-political status"
                className="px-3 py-2"
              />
              <input
                name="block"
                defaultValue={nation.block ?? ""}
                placeholder="Block"
                className="px-3 py-2"
              />
              <input
                name="culture"
                defaultValue={nation.culture ?? ""}
                placeholder="Culture"
                className="px-3 py-2 md:col-span-2"
              />
              <button className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10 md:col-span-2">
                Save Stats
              </button>
            </form>
          </div>
        </Panel>
      ) : null}

      {nation.statNotes?.length ? (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-50">Current Status</h2>
            <Badge tone="warning">Temporary Modifier</Badge>
          </div>
          <ul className="grid gap-3 text-sm leading-7 text-zinc-300">
            {nation.statNotes.map((note) => (
              <li
                key={note}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                {note}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {nation.actions?.length ? (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Action History</h2>
            <Badge tone="accent">{nation.actions.length} Recorded</Badge>
          </div>
          <div className="grid gap-4">
            {nation.actions.map((entry, index) => (
              <article
                key={`${entry.type}-${index}`}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{`Action ${index + 1}`}</Badge>
                  <Badge
                    tone={
                      entry.type.toLowerCase().includes("military")
                        ? "warning"
                        : "accent"
                    }
                  >
                    {entry.type}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-400">
                  Nation: {entry.nation}
                </p>
                <div className="mt-3">
                  <WikiRenderer content={entry.action} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}

      {nation.trackedActions?.length ? (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-50">Lore Tracker</h2>
            <Badge tone="warning">{nation.trackedActions.length} Tracked</Badge>
          </div>
          <div className="grid gap-4">
            {nation.trackedActions.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{entry.status.replace("_", " ")}</Badge>
                  <Badge tone="accent">{entry.type}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  Estimated completion: {entry.timeframe}
                </p>
                <div className="mt-3">
                  <WikiRenderer content={entry.action} />
                </div>
                {entry.requiresSpinReason ? (
                  <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                    Requires spin: {entry.requiresSpinReason}
                  </p>
                ) : null}
                {entry.outcome ? (
                  <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-100">
                      Outcome
                    </p>
                    <div className="mt-2">
                      <WikiRenderer content={entry.outcome} />
                    </div>
                  </div>
                ) : null}
                {entry.updates.length ? (
                  <div className="mt-4 grid gap-2">
                    {entry.updates.map((update) => (
                      <div
                        key={update.id}
                        className="rounded-md border border-white/10 bg-black/20 p-3"
                      >
                        <WikiRenderer content={update.content} />
                        <p className="mt-2 text-xs text-zinc-500">
                          {new Date(update.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>
      ) : null}

      <NationTimeline nation={nation} />

      <Panel>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Wiki</h2>
        <WikiRenderer content={wiki} />
      </Panel>

      <Panel>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Map</h2>
        <NationMap />
      </Panel>
    </div>
  );
}
