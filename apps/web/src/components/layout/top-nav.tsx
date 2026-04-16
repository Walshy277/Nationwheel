import Link from "next/link";
import Image from "next/image";
import { canAccessControlPanel, type Role } from "@nation-wheel/shared";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/auth";

const primaryLinks = [
  { href: "/nations", label: "Nations" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/map", label: "Map" },
];

const secondaryLinks = [
  { href: "/news", label: "News" },
  { href: "/lore", label: "Lore" },
  { href: "/wars", label: "Wars" },
  { href: "/actions", label: "Actions" },
  { href: "/activity", label: "Activity" },
];

const toolsMenuClassName =
  "mt-2 grid max-h-[70vh] gap-1 overflow-y-auto rounded-lg border border-white/10 bg-[#10120f] p-2 shadow-2xl shadow-black/30 lg:absolute lg:right-0 lg:top-10 lg:mt-0 lg:w-52 lg:shadow-black/40";

function hasPanelAccess(roles: Role[], panel: "LORECP" | "ADMINCP" | "NEWSCP") {
  return roles.some((role) => canAccessControlPanel(role, panel));
}

export async function TopNav() {
  const user = await getCurrentUser();
  const userRoles = user
    ? Array.from(new Set([user.role, ...(user.roles ?? [])]))
    : [];
  const controlLinks = [
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(hasPanelAccess(userRoles, "LORECP")
      ? [{ href: "/lorecp", label: "LoreCP" }]
      : []),
    ...(hasPanelAccess(userRoles, "NEWSCP")
      ? [{ href: "/newscp", label: "NewsCP" }]
      : []),
    ...(hasPanelAccess(userRoles, "ADMINCP")
      ? [{ href: "/admincp", label: "AdminCP" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080907]/95 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/nationwheel_logo.jpg"
            alt="Nation Wheel"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg border border-emerald-300/35 object-cover"
            priority
          />
          <span className="text-sm font-bold uppercase text-zinc-100">
            Nation Wheel
          </span>
        </Link>
        <nav className="order-3 grid w-full gap-2 text-sm text-zinc-300 lg:order-none lg:flex lg:w-auto lg:items-center lg:gap-1">
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
            <Link
              href="/nations"
              className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
            >
              Nations
            </Link>
            {primaryLinks
              .filter((link) => link.href !== "/nations")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
          </div>
          <details className="group w-full lg:relative lg:w-auto">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-semibold text-zinc-200 hover:bg-white/5 hover:text-white lg:border-transparent lg:bg-transparent [&::-webkit-details-marker]:hidden">
              <span>More</span>
              <span className="text-xs text-emerald-200 transition group-open:rotate-180 lg:ml-2">
                v
              </span>
            </summary>
            <div className={toolsMenuClassName}>
              {controlLinks.length ? (
                <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase text-emerald-200">
                  Control Panels
                </div>
              ) : null}
              {controlLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 font-semibold text-zinc-100 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase text-zinc-500">
                Explore
              </div>
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-emerald-300/60 hover:bg-white/5"
          >
            {user ? user.role : "Login"}
          </Link>
          {user ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  );
}
