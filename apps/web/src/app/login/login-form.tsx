"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({ discordEnabled }: { discordEnabled: boolean }) {
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: true,
      callbackUrl: "/dashboard",
    });

    if (result?.error) setError("Invalid email or password.");
  }

  return (
    <div className="grid gap-4">
      {discordEnabled ? (
        <>
          <button
            type="button"
            onClick={() =>
              void signIn("discord", { callbackUrl: "/dashboard/wiki" })
            }
            className="rounded-lg bg-[#5865f2] px-4 py-2 font-bold text-white hover:bg-[#4752c4]"
          >
            Continue with Discord
          </button>

          <div className="flex items-center gap-3 text-xs uppercase text-zinc-500">
            <span className="h-px flex-1 bg-white/10" />
            Admin login
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      ) : null}

      <form action={onSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm text-zinc-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="px-3 py-2 text-white"
          />
        </label>
        <label className="grid gap-2 text-sm text-zinc-300">
          Password
          <input
            name="password"
            type="password"
            required
            className="px-3 py-2 text-white"
          />
        </label>
        {error ? (
          <p className="text-sm text-[color:var(--danger)]">{error}</p>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-emerald-300 px-4 py-2 font-bold text-zinc-950 hover:bg-emerald-200"
        >
          Enter Command
        </button>
      </form>
    </div>
  );
}
