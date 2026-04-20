"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  primaryNavLinks,
  publicDirectoryGroups,
} from "@/lib/site-directory";

type NavLink = {
  href: string;
  label: string;
  detail?: string;
};

type UnreadCounts = {
  mail: number;
  notifications: number;
};

const toolsMenuClassName =
  "mt-2 grid max-h-[76vh] gap-4 overflow-y-auto rounded-lg border border-white/10 bg-[#10120f] p-3 shadow-2xl shadow-black/30 lg:absolute lg:left-1/2 lg:top-10 lg:mt-0 lg:w-[900px] lg:-translate-x-1/2 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-4 lg:shadow-black/40";

function MenuSection({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: NavLink[];
  onNavigate: () => void;
}) {
  return (
    <section>
      <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <div className="grid gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            role="menuitem"
            onClick={onNavigate}
            className="group rounded-lg border border-white/8 bg-white/[0.02] px-3 py-3 hover:border-emerald-300/40 hover:bg-white/5"
          >
            <span className="block font-bold text-zinc-100 group-hover:text-emerald-100">
              {link.label}
            </span>
            {link.detail ? (
              <span className="mt-1 block text-xs leading-5 text-zinc-500 group-hover:text-zinc-300">
                {link.detail}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function NavIconButton({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: ReactNode;
}) {
  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <Link
      href={href}
      aria-label={count ? `${label}, ${count} unread` : label}
      title={count ? `${label}: ${count} unread` : label}
      className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-zinc-200 hover:border-emerald-300/60 hover:bg-white/5 hover:text-white"
    >
      {children}
      {count ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-[#080907] bg-amber-300 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-zinc-950">
          {displayCount}
        </span>
      ) : null}
    </Link>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function LetterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function TopNavMenu({
  userLabel,
  myNationHref,
  unreadCounts,
  controlLinks,
}: {
  userLabel: string | null;
  myNationHref: string | null;
  unreadCounts: UnreadCounts;
  controlLinks: NavLink[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

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

        <nav className="order-3 grid w-full gap-2 text-sm text-zinc-300 lg:order-none lg:flex lg:w-auto lg:items-center lg:gap-1 xl:hidden">
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/directory"
              className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold hover:bg-white/5 hover:text-white"
            >
              Directory
            </Link>
          </div>

          <div ref={menuRef} className="w-full lg:relative lg:w-auto">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={() => setIsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-semibold text-zinc-200 hover:bg-white/5 hover:text-white lg:w-auto lg:border-transparent lg:bg-transparent"
            >
              <span>Site Sections</span>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publicDirectoryGroups.map((group) => (
                    <MenuSection
                      key={group.title}
                      title={group.title}
                      links={group.links}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </div>
                <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/8 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">
                    Control Hub
                  </div>
                  <h2 className="mt-3 text-xl font-black text-zinc-50">
                    Dashboard
                  </h2>
                  {userLabel ? (
                    <>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        Manage your nation and open any available staff control
                        panel from one place.
                      </p>
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="mt-4 inline-flex w-full justify-center rounded-lg bg-emerald-300 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-200"
                      >
                        Open Dashboard
                      </Link>
                      {myNationHref ? (
                        <Link
                          href={myNationHref}
                          role="menuitem"
                          onClick={() => setIsOpen(false)}
                          className="mt-2 inline-flex w-full justify-center rounded-lg border border-emerald-300/45 px-4 py-3 font-bold text-emerald-100 hover:bg-emerald-300/10"
                        >
                          Open My Nation
                        </Link>
                      ) : null}
                      {controlLinks.length ? (
                        <div className="mt-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-100">
                            Staff Shortcuts
                          </div>
                          <div className="grid gap-2">
                            {controlLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg border border-emerald-300/20 bg-black/20 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/60 hover:bg-emerald-300/10"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        Sign in to manage your nation and access staff tools.
                      </p>
                      <Link
                        href="/login"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="mt-4 inline-flex w-full justify-center rounded-lg bg-emerald-300 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-200"
                      >
                        Login
                      </Link>
                    </>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          {userLabel ? (
            <>
              <NavIconButton
                href="/dashboard/notifications"
                label="Notifications"
                count={unreadCounts.notifications}
              >
                <BellIcon />
              </NavIconButton>
              <NavIconButton
                href="/dashboard/inbox"
                label="Postal mail"
                count={unreadCounts.mail}
              >
                <LetterIcon />
              </NavIconButton>
            </>
          ) : null}
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
