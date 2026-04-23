"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { isActivePath } from "@/lib/navigation";
import type { SiteDirectoryLink } from "@/lib/site-directory";

type NavBadgeCounts = {
  mail: number;
  notifications: number;
};

type SideNavGroupData = {
  title: string;
  links: SiteDirectoryLink[];
};

function badgeForLink(href: string, counts: NavBadgeCounts) {
  if (href === "/dashboard/inbox") return counts.mail;
  if (href === "/dashboard/notifications") return counts.notifications;
  return 0;
}

function SideNavLink({
  link,
  badgeCount = 0,
}: {
  link: SiteDirectoryLink;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, link.href);
  const badgeLabel = badgeCount > 99 ? "99+" : badgeCount.toString();

  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group grid gap-1 rounded-lg border px-3 py-2",
        isActive
          ? "border-emerald-300/40 bg-emerald-900/18"
          : "border-transparent hover:border-emerald-300/35 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2 text-sm font-bold">
        <span
          className={
            isActive
              ? "text-emerald-100"
              : "text-zinc-100 group-hover:text-emerald-100"
          }
        >
          {link.label}
        </span>
        {badgeCount ? (
          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black leading-none text-zinc-950">
            {badgeLabel}
          </span>
        ) : null}
      </span>
      <span
        className={[
          "line-clamp-2 text-xs leading-5",
          isActive
            ? "text-zinc-300"
            : "text-zinc-500 group-hover:text-zinc-300",
        ].join(" ")}
      >
        {link.detail}
      </span>
    </Link>
  );
}

function SideNavGroup({
  title,
  links,
  counts,
}: {
  title: string;
  links: SiteDirectoryLink[];
  counts: NavBadgeCounts;
}) {
  if (!links.length) return null;

  return (
    <section className="grid gap-2">
      <h2 className="px-3 text-xs font-black uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="grid gap-1">
        {links.map((link) => (
          <SideNavLink
            key={link.href}
            link={link}
            badgeCount={badgeForLink(link.href, counts)}
          />
        ))}
      </div>
    </section>
  );
}

export function SideNavClient({
  counts,
  groups,
}: {
  counts: NavBadgeCounts;
  groups: SideNavGroupData[];
}) {
  const [query, setQuery] = useState("");
  const visibleGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return groups;

    return groups
      .map((group) => ({
        ...group,
        links: group.links.filter((link) =>
          `${link.label} ${link.detail} ${link.href}`
            .toLowerCase()
            .includes(normalized),
        ),
      }))
      .filter((group) => group.links.length > 0);
  }, [groups, query]);

  return (
    <nav className="grid gap-6" aria-label="Global side navigation">
      <label className="grid gap-2 px-1">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Search nav
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find any page"
          className="min-h-10 px-3 text-sm"
        />
      </label>
      {visibleGroups.map((group) => (
        <SideNavGroup
          key={group.title}
          title={group.title}
          links={group.links}
          counts={counts}
        />
      ))}
    </nav>
  );
}
