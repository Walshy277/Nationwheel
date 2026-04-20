import Link from "next/link";
import { formatGameDate, getGameClock } from "@/lib/game-clock";

export async function GameDateBanner() {
  const clock = await getGameClock();
  const updatedBy = clock.updatedByUser?.name ?? clock.updatedByUser?.email;

  return (
    <div className="border-b border-white/10 bg-[#0c100d]/92">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-emerald-300/45 bg-emerald-900/12 px-2.5 py-1 text-xs font-bold uppercase text-emerald-100">
            In-game date
          </span>
          <span className="font-black text-zinc-50">
            {formatGameDate(clock)}
          </span>
          {updatedBy ? (
            <span className="text-xs text-zinc-500">advanced by {updatedBy}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-zinc-400">
          <Link href="/directory" className="hover:text-emerald-100">
            Directory
          </Link>
          <Link href="/actions" className="hover:text-emerald-100">
            Actions
          </Link>
          <Link href="/news" className="hover:text-emerald-100">
            News
          </Link>
          <Link href="/lore" className="hover:text-emerald-100">
            Lore
          </Link>
        </div>
      </div>
    </div>
  );
}
