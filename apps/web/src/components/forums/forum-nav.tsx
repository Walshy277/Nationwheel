"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { canModerateForums } from "@/lib/role-utils";

type UserLike = {
  role: Role;
  roles?: Role[] | null;
} | null;

function navClass(active: boolean) {
  return active
    ? "rounded-lg border border-emerald-300/60 bg-emerald-950/40 px-3 py-2 text-sm font-bold text-emerald-50"
    : "rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-200 hover:bg-white/5";
}

export function ForumNav({ user }: { user: UserLike }) {
  const pathname = usePathname();
  const items = [
    { href: "/forums", label: "Boards" },
    { href: "/forums/new", label: "New Topic" },
  ];

  if (canModerateForums(user)) {
    items.push({ href: "/forums/moderation", label: "Moderation" });
  }

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={navClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
