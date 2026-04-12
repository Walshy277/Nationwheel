import Link from "next/link";
import Image from "next/image";
import { canAccessControlPanel } from "@nation-wheel/shared";
import { getCurrentUser } from "@/lib/auth";
import { listNationSummaries } from "@/lib/nations";

const primaryLinks = [
  { href: "/nations", label: "Nations" },
  { href: "/compare", label: "Compare" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/map", label: "Map" },
];

const secondaryLinks = [
  { href: "/lore", label: "Lore" },
  { href: "/wars", label: "Wars" },
  { href: "/actions", label: "Actions" },
  { href: "/activity", label: "Activity" },
];

const nationMenuClassName =
  "invisible absolute left-1/2 top-9 z-50 max-h-[70vh] w-80 -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-[#10120f] p-2 opacity-0 shadow-2xl shadow-black/40 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

const toolsMenuClassName =
  "invisible absolute right-0 top-9 z-50 w-48 rounded-lg border border-white/10 bg-[#10120f] p-2 opacity-0 shadow-2xl shadow-black/40 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

export async function TopNav() {
  const [user, nations] = await Promise.all([
    getCurrentUser(),
    listNationSummaries(),
  ]);
  const toolLinks = [
    ...secondaryLinks,
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(user && canAccessControlPanel(user.role, "LORECP")
      ? [{ href: "/lorecp", label: "LoreCP" }]
      : []),
    ...(user && canAccessControlPanel(user.role, "ADMINCP")
      ? [{ href: "/admincp", label: "AdminCP" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080907]/94 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto text-sm text-zinc-300 lg:order-none lg:w-auto lg:overflow-visible">
          <div className="group relative">
            <Link
              href="/nations"
              className="rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
            >
              Nations
            </Link>
            <div className={nationMenuClassName}>
              <div className="px-3 py-2 text-xs font-bold uppercase text-emerald-200">
                Canon Nations
              </div>
              <div className="grid gap-1">
                {nations.map((nation) => (
                  <Link
                    key={nation.slug}
                    href={`/nations/${nation.slug}`}
                    className="rounded-md px-3 py-2 hover:bg-white/5"
                  >
                    <span className="block text-sm font-semibold text-zinc-100">
                      {nation.name}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {nation.government}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {primaryLinks
            .filter((link) => link.href !== "/nations")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          <div className="group relative">
            <button
              type="button"
              className="rounded-lg px-3 py-2 font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              More
            </button>
            <div className={toolsMenuClassName}>
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <Link
          href="/login"
          className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-emerald-300/60 hover:bg-white/5"
        >
          {user ? user.role : "Login"}
        </Link>
      </div>
    </header>
  );
}
