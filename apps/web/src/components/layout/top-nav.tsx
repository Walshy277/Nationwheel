import Link from "next/link";
import { canAccessControlPanel } from "@nation-wheel/shared";
import { getCurrentUser } from "@/lib/auth";
import { listNationSummaries } from "@/lib/nations";

const publicLinks = [
  { href: "/nations", label: "Nations" },
  { href: "/compare", label: "Compare" },
  { href: "/activity", label: "Activity" },
  { href: "/actions", label: "Actions" },
  { href: "/wars", label: "Wars" },
  { href: "/lore", label: "Lore" },
  { href: "/map", label: "Map" },
  { href: "/leaderboards", label: "Leaderboards" },
];

export async function TopNav() {
  const [user, nations] = await Promise.all([
    getCurrentUser(),
    listNationSummaries(),
  ]);
  const links = [
    ...publicLinks,
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(user && canAccessControlPanel(user.role, "LORECP")
      ? [{ href: "/lorecp", label: "LoreCP" }]
      : []),
    ...(user && canAccessControlPanel(user.role, "ADMINCP")
      ? [{ href: "/admincp", label: "AdminCP" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080907]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-300/35 bg-emerald-300/10 text-sm font-black text-emerald-100">
            NW
          </span>
          <span className="text-sm font-bold uppercase text-zinc-100">
            Nation Wheel
          </span>
        </Link>
        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto text-sm text-zinc-300 md:order-none md:w-auto md:gap-3 md:overflow-visible">
          <div className="group relative">
            <Link
              href="/nations"
              className="rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
            >
              Nations
            </Link>
            <div className="invisible absolute left-1/2 top-9 z-50 max-h-[70vh] w-80 -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-[#10120f] p-2 opacity-0 shadow-2xl shadow-black/40 transition group-hover:visible group-hover:opacity-100">
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
          {links
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
