import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { listActivityFeed } from "@/lib/activity";

export const metadata: Metadata = {
  title: "Activity Archive",
  description:
    "Review Nation Wheel canon actions, active modifiers, and live lore tracker updates.",
  alternates: { canonical: "/activity-archive" },
};

export default async function ActivityArchivePage() {
  const feed = await listActivityFeed();

  return (
    <PageShell>
      <div>
        <Badge tone="accent">World Activity</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Activity Archive
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Canon actions, active modifiers, and live lore tracker updates in one
          review queue.
        </p>
      </div>

      <div className="grid gap-4">
        {feed.map((item) => (
          <Panel key={item.id} className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <Badge
                tone={item.status === "REQUIRES SPIN" ? "warning" : "accent"}
              >
                {item.status ?? item.type}
              </Badge>
              <Link
                href={`/nations/${item.nationSlug}`}
                className="mt-4 block text-xl font-bold text-zinc-50 hover:text-emerald-100"
              >
                {item.nationName}
              </Link>
              {item.timestamp ? (
                <p className="mt-2 text-sm text-zinc-400">
                  {new Date(item.timestamp).toLocaleString("en-GB")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">Canon archive</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-400">
                {item.type}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {item.detail}
              </p>
            </div>
          </Panel>
        ))}
      </div>

      {feed.length === 0 ? (
        <Panel className="text-zinc-300">No activity has been logged yet.</Panel>
      ) : null}
    </PageShell>
  );
}
