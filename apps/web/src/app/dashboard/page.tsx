import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Leader Console</Badge>
        <h1 className="mt-4 text-4xl font-black text-white">Dashboard</h1>
        <p className="mt-3 text-slate-300">
          {user
            ? `Signed in as ${user.email} with ${user.role} access.`
            : "Login to edit your nation wiki."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-bold text-zinc-50">Lore Drafting</h2>
          <p className="mt-3 text-zinc-300">
            Leaders can maintain their own nation lore and upload a flag without
            changing structured stats.
          </p>
          <Link
            href="/dashboard/lore"
            className="mt-5 inline-flex rounded-lg bg-emerald-300 px-4 py-2 font-bold text-zinc-950 hover:bg-emerald-200"
          >
            Edit Lore
          </Link>
        </Panel>
        <Panel>
          <h2 className="text-xl font-bold text-zinc-50">
            Permission Boundary
          </h2>
          <p className="mt-3 text-zinc-300">
            Stats edits are reserved for Lore and Admin roles. Nation creation
            and removal are Admin only.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
