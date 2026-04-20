import Image from "next/image";
import { cn } from "@/lib/utils";
import mapImage from "../../../../../assets/Final_map_S1.jpg";

export function NationMap({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-lg border border-white/10 bg-[#0c0e0b]",
        className,
      )}
    >
      <div className="relative aspect-[1366/768] min-h-[320px]">
        <Image
          src={mapImage}
          alt="Nation Wheel world map"
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="object-contain"
        />
      </div>
      <figcaption className="border-t border-white/10 bg-black/35 px-4 py-3 text-sm leading-6 text-zinc-300 sm:px-5">
        Static Season 1 reference map. Nation details live in the nation
        profiles and wiki pages.
      </figcaption>
    </figure>
  );
}
