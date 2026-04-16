"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type NavLink = {
  href: string;
  label: string;
};

const toolsMenuClassName =
  "mt-2 grid max-h-[70vh] gap-1 overflow-y-auto rounded-lg border border-white/10 bg-[#10120f] p-2 shadow-2xl shadow-black/30 lg:absolute lg:right-0 lg:top-10 lg:mt-0 lg:w-56 lg:shadow-black/40";

export function TopNavMenu({
  userLabel,
  myNationHref,
  controlLinks,
}: {
  userLabel: string | null;
  myNationHref: string | null;
  controlLinks: NavLink[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const primaryLinks: NavLink[] = [
    ...(myNationHref ? [{ href: myNationHref, label: "My Nation" }] : []),
    { href: "/nations", label: "Nations" },
    { href: "/news", label: "News" },
  ];

  const exploreLinks: NavLink[] = [
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/map", label: "Map" },
    { href: "/lore", label: "Lore" },
    { href: "/wars", label: "Wars" },
    { href: "/actions", label: "Actions" },
    { href: "/activity", label: "Activity" },
  ];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div ref={menuRef} className="w-full lg:relative lg:w-auto">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={() => setIsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-semibold text-zinc-200 hover:bg-white/5 hover:text-white lg:w-auto lg:border-transparent lg:bg-transparent"
            >
              <span>More</span>
              <span
                className={`text-xs text-emerald-200 transition ${
                  isOpen ? "rotate-180" : ""
                } lg:ml-2`}
              >
                v
              </span>
            </button>
            {isOpen ? (
              <div className={toolsMenuClassName} role="menu">
                {controlLinks.length ? (
                  <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase text-emerald-200">
                    Control Panels
                  </div>
                ) : null}
                {controlLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md px-3 py-2 font-semibold text-zinc-100 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase text-zinc-500">
                  Explore
                </div>
                {exploreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={userLabel ? "/dashboard" : "/login"}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-emerald-300/60 hover:bg-white/5"
          >
            {userLabel ?? "Login"}
          </Link>
          {userLabel ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  );
}
