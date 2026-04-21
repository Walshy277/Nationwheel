import Link from "next/link";
import { Role } from "@prisma/client";
import { ControlSearch } from "@/components/control/control-search";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { adminCpLinks } from "@/lib/control-panels";
import { listAdminLogEvents } from "@/lib/admin-log-events";
import { requirePageRole } from "@/lib/permissions";

const kindLabels = {
  revision: "Revision",
  action_update: "Action Update",
  notification: "Alert",
  news: "News",
} as const;

export default async function AdminLogsPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const { events, counts } = await listAdminLogEvents();

  return (
    <ControlLayout
      title="AdminCP"
      eyebrow="Audit"
      description="Follow revisions, lore updates, outgoing alerts, and published news from one readable event stream."
      links={adminCpLinks}
      stats={[
        { label: "Revisions", value: counts.revisions },
        { label: "Lore Updates", value: counts.actionUpdates },
        { label: "Alerts", value: counts.notifications },
        { label: "News Posts", value: counts.newsPosts },
      ]}
    >
      <div className="grid gap-5">
        <Panel>
          <Badge tone="accent">Revision Logs</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">Friendly Logs</h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            This feed merges the main admin-facing events so staff can review
            what changed, who triggered it, and where to jump next.
          </p>
        </Panel>

        <ControlSearch
          targetId="admin-log-list"
          label="Search logs"
          placeholder="Search by nation, editor, alert, action type, or changed value"
        />

        <div className="grid gap-3 md:grid-cols-4">
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Total feed
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {events.length}
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Nation revisions
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {counts.revisions}
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Staff updates
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {counts.actionUpdates}
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Outgoing alerts
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {counts.notifications}
            </p>
          </Panel>
        </div>

        <Panel>
          <div id="admin-log-list" className="grid gap-3">
            {events.map((event) => (
              <article
                key={event.id}
                data-control-search-item
                data-search={event.search}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={event.tone}>{kindLabels[event.kind]}</Badge>
                      <Badge>{event.actor}</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-zinc-50">
                      {event.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                      {event.summary}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {event.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>
                  <Link
                    href={event.href}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                  >
                    Open
                  </Link>
                </div>

                {event.details.length ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {event.details.map((detail) => (
                      <div
                        key={`${event.id}-${detail.label}`}
                        className="rounded-md border border-white/10 bg-black/25 p-3 text-sm"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                          {detail.label}
                        </p>
                        <p className="mt-2 leading-6 text-zinc-300">
                          {detail.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {events.length === 0 ? (
            <p className="py-6 text-slate-400">No admin events have been recorded yet.</p>
          ) : null}
        </Panel>
      </div>
    </ControlLayout>
  );
}
