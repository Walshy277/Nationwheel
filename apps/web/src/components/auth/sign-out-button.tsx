"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-red-300/60 hover:bg-red-300/10 hover:text-red-100"
    >
      Sign out
    </button>
  );
}
