import Link from "next/link";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { adminCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

function formatActor(revision: {
  changedByUser: { name: string | null; email: string | null } | null;
}) {
  return revision.changedByUser?.name ?? revision.changedByUser?.email ?? "System";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function summarizeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Empty";
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117).trimEnd()}...` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function changedFields(previousValue: unknown, newValue: unknown) {
  const previous = asRecord(previousValue);
  const next = asRecord(newValue);
  return Object.keys(next)
    .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
    .map((key) => ({
      key,
      previous: summarizeValue(previous[key]),
      next: summarizeValue(next[key]),
    }));
}

function revisionTitle(fieldType: string) {
  const titles: Record<string, string> = {
    ACTION: "Action updated",
    FLAG: "Profile picture changed",
    LEADER_NAME: "Leader name changed",
    STATS: "Stats updated",
    WIKI: "Wiki edited",
  };

  return titles[fieldType] ?? `${fieldType} changed`;
}

export default async function AdminLogsPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const revisions = await getPrisma().nationRevision.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      nation: { select: { name: true, slug: true } },
      changedByUser: { select: { name: true, email: true } },
    },
  });

  return (
    <ControlLayout title="AdminCP" links={adminCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">Revision Logs</h1>
          <p className="mt-3 text-slate-300">
            Recent nation changes, written as readable events instead of raw
            database payloads.
          </p>
        </Panel>

        <Panel>
          <div className="grid gap-3">
            {revisions.map((revision) => {
              const fields = changedFields(
                revision.previousValue,
                revision.newValue,
              );

              return (
                <article
                  key={revision.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge tone="accent">
                        {revisionTitle(revision.fieldType)}
                      </Badge>
                      <h2 className="mt-3 text-xl font-bold text-zinc-50">
                        <Link
                          href={`/nations/${revision.nation.slug}`}
                          className="hover:text-emerald-100"
                        >
                          {revision.nation.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        {revision.createdAt.toLocaleString("en-GB")} by{" "}
                        {formatActor(revision)}
                      </p>
                    </div>
                    <Link
                      href={`/lorecp/nations/${revision.nationId}`}
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                    >
                      Review
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {fields.slice(0, 6).map((field) => (
                      <div
                        key={field.key}
                        className="rounded-md border border-white/10 bg-black/25 p-3 text-sm"
                      >
                        <div className="font-bold capitalize text-zinc-100">
                          {field.key.replace(/([A-Z])/g, " $1")}
                        </div>
                        <div className="mt-2 grid gap-2 text-zinc-400 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-zinc-500">
                              Before:
                            </span>{" "}
                            {field.previous}
                          </p>
                          <p>
                            <span className="font-semibold text-zinc-500">
                              After:
                            </span>{" "}
                            {field.next}
                          </p>
                        </div>
                      </div>
                    ))}
                    {fields.length === 0 ? (
                      <p className="text-sm text-zinc-400">
                        Change details were recorded, but no field-level
                        difference was detected.
                      </p>
                    ) : null}
                    {fields.length > 6 ? (
                      <p className="text-xs text-zinc-500">
                        {fields.length - 6} more changed fields hidden.
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {revisions.length === 0 ? (
            <p className="py-6 text-slate-400">
              No revisions have been recorded yet.
            </p>
          ) : null}
        </Panel>
      </div>
    </ControlLayout>
  );
}
