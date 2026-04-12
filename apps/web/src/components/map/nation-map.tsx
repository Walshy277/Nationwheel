import Image from "next/image";
import { cn } from "@/lib/utils";
import mapImage from "../../../../../assets/Final_map_S1.jpg";

export function NationMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[1366/768] min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#0c0e0b]",
        className,
      )}
    >
      <Image
        src={mapImage}
        alt="Nation Wheel world map"
        fill
        priority
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-x-4 top-4 z-10 flex flex-wrap items-center justify-between gap-3 sm:inset-x-6 sm:top-6">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-100 drop-shadow">
            Strategic Map
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Season 1 world map
          </h2>
        </div>
      </div>
      <div className="absolute inset-x-6 bottom-6 z-10 rounded-lg border border-white/10 bg-black/50 p-4 text-sm leading-6 text-zinc-200">
        Static Season 1 reference map. Nation details live in the nation
        profiles and wiki pages.
      </div>
    </div>
  );
}
