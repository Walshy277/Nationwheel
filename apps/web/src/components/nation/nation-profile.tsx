import Image from "next/image";
import { createNationOverview, type NationSummary } from "@nation-wheel/shared";
import { NationMap } from "@/components/map/nation-map";
import { NationStatGrid } from "@/components/nation/nation-stat-grid";
import { NationTimeline } from "@/components/nation/nation-timeline";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, Panel } from "@/components/ui/shell";

export function NationProfile({
  nation,
  wiki,
}: {
  nation: NationSummary;
  wiki: string;
}) {
  return (
    <div className="grid gap-6">
      <Panel className="grid gap-6 lg:grid-cols-[180px_1fr]">
        {nation.flagImage ? (
          <Image
            src={nation.flagImage}
            alt={`${nation.name} flag`}
            width={144}
            height={144}
            unoptimized
            className="h-36 w-36 rounded-lg border border-white/10 object-cover"
          />
        ) : (
          <div className="grid h-36 w-36 place-items-center rounded-lg border border-emerald-300/35 bg-emerald-300/10 text-4xl font-black text-emerald-100">
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
          <h2 className="mb-4 text-xl font-bold text-zinc-50">Overview</h2>
          <p className="leading-8 text-zinc-300">
            {createNationOverview(nation)}
          </p>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-xl font-bold text-zinc-50">Stats</h2>
          <NationStatGrid nation={nation} />
        </Panel>
      </div>

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
                <p className="mt-3 leading-7 text-zinc-300">{entry.action}</p>
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
                <p className="mt-3 leading-7 text-zinc-300">{entry.action}</p>
                {entry.requiresSpinReason ? (
                  <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                    Requires spin: {entry.requiresSpinReason}
                  </p>
                ) : null}
                {entry.updates.length ? (
                  <div className="mt-4 grid gap-2">
                    {entry.updates.map((update) => (
                      <div
                        key={update.id}
                        className="rounded-md border border-white/10 bg-black/20 p-3"
                      >
                        <p className="text-sm leading-6 text-zinc-300">
                          {update.content}
                        </p>
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
