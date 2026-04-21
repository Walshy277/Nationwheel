"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/navigation";

export function ControlPanelNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2" aria-label="Control panel navigation">
      {links.map((link) => {
        const isActive = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-md border px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "border-emerald-300/45 bg-emerald-900/18 text-emerald-100"
                : "border-white/8 bg-white/[0.02] text-zinc-300 hover:border-emerald-300/40 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
