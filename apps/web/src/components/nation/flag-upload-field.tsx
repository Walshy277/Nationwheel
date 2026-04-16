"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function FlagUploadField({
  currentImage,
  nationName,
  label = "Profile Picture",
  description = "PNG, JPG, GIF, or WebP. Maximum 2 MB.",
  className,
}: {
  currentImage?: string | null;
  nationName: string;
  label?: string;
  description?: string;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageSrc = previewUrl ?? currentImage ?? null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <label className={className ?? "grid gap-3 text-sm text-zinc-300"}>
      <span className="font-semibold text-zinc-200">{label}</span>
      <span className="text-xs leading-5 text-zinc-500">{description}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/30 text-lg font-black text-emerald-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={`${nationName} profile picture preview`}
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
          ) : (
            nationName.slice(0, 2).toUpperCase()
          )}
        </div>
        <input
          name="flag"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/*"
          className="min-w-0 flex-1 px-3 py-2 text-sm text-zinc-100"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreviewUrl((current) => {
              if (current) URL.revokeObjectURL(current);
              return file ? URL.createObjectURL(file) : null;
            });
          }}
        />
      </div>
    </label>
  );
}
