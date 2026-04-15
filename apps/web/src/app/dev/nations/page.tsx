import Link from "next/link";
import { Role } from "@prisma/client";
import { NationDevEditor } from "@/app/dev/nations/nation-dev-editor";
import { Badge, PageShell } from "@/components/ui/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function DevNationsPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);

  return (
    <PageShell className="grid gap-5">
      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)]/90 p-5">
        <Badge tone="warning">Local dev tool</Badge>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-50">Nation Editor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Edit canon stats, add nations, then save the text source and
              shared canon file in one step.
            </p>
          </div>
          <Link
            href="/nations"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300 hover:bg-white/5"
          >
            Browse Profiles
          </Link>
        </div>
      </section>

      <NationDevEditor />
    </PageShell>
  );
}
