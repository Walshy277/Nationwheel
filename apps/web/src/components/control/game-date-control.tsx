import { advanceGameDayAction } from "@/app/actions";
import { Badge, Panel } from "@/components/ui/shell";
import { formatGameDate, getGameClock } from "@/lib/game-clock";

export async function GameDateControl() {
  const clock = await getGameClock();
  const updatedBy = clock.updatedByUser?.name ?? clock.updatedByUser?.email;

  return (
    <Panel className="border-emerald-300/35 bg-emerald-900/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="accent">World Clock</Badge>
          <h2 className="mt-3 text-2xl font-black text-zinc-50">
            {formatGameDate(clock)}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
            The game date only advances when lore team or admin staff confirms
            the next day. Use this after daily actions and news have been
            reviewed.
          </p>
          {clock.updatedAt ? (
            <p className="mt-2 text-xs text-zinc-500">
              Last changed {clock.updatedAt.toLocaleString("en-GB")}
              {updatedBy ? ` by ${updatedBy}` : ""}.
            </p>
          ) : null}
        </div>
        <form action={advanceGameDayAction}>
          <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
            Next Day
          </button>
        </form>
      </div>
    </Panel>
  );
}
