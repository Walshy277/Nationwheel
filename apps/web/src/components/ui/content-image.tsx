/* eslint-disable @next/next/no-img-element */

export function ContentImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={[
        "h-auto w-full rounded-lg border border-white/10 object-cover",
        className,
      ].join(" ")}
    />
  );
}
