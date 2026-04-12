import { LoginForm } from "@/app/login/login-form";
import { PageShell, Panel } from "@/components/ui/shell";

export default function LoginPage() {
  const discordEnabled = Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
  );

  return (
    <PageShell className="grid min-h-[calc(100vh-8rem)] place-items-center">
      <Panel className="w-full max-w-md">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase text-emerald-200">
            Secure Access
          </div>
          <h1 className="mt-3 text-3xl font-black text-zinc-50">Login</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Use seeded credentials after running `pnpm db:seed`.
          </p>
        </div>
        <LoginForm discordEnabled={discordEnabled} />
      </Panel>
    </PageShell>
  );
}
