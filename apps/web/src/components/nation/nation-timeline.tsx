import type { NationSummary } from "@nation-wheel/shared";
import { Badge, Panel } from "@/components/ui/shell";

type TimelineEntry = {
  title: string;
  eyebrow: string;
  detail: string;
  tone?: "neutral" | "accent" | "warning";
};

function getTimelineEntries(nation: NationSummary): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Canon profile established",
      eyebrow: "Baseline",
      detail: `${nation.name} enters the registry as ${nation.government} with ${nation.people} people.`,
      tone: "accent",
    },
  ];

  for (const note of nation.statNotes ?? []) {
    entries.push({
      title: "Status modifier",
      eyebrow: "Current status",
      detail: note,
      tone: "warning",
    });
  }

  for (const action of nation.actions ?? []) {
    entries.push({
      title: action.type,
      eyebrow: action.nation,
      detail: action.action,
      tone: action.type.toLowerCase().includes("military")
        ? "warning"
        : "accent",
    });
  }

  for (const action of nation.trackedActions ?? []) {
    entries.push({
      title: action.type,
      eyebrow: action.status.replace("_", " "),
      detail: action.action,
      tone: action.status === "REQUIRES_SPIN" ? "warning" : "neutral",
    });

    for (const update of action.updates) {
      entries.push({
        title: "Lore update",
        eyebrow: new Date(update.createdAt).toLocaleString("en-GB"),
        detail: update.content,
      });
    }
  }

  return entries;
}

export function NationTimeline({ nation }: { nation: NationSummary }) {
  const entries = getTimelineEntries(nation);

  return (
    <Panel>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">Timeline</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Canon baseline, active modifiers, and recorded action history.
          </p>
        </div>
        <Badge tone="accent">{entries.length} entries</Badge>
      </div>

      <ol className="relative grid gap-4 border-l border-white/15 pl-5">
        {entries.map((entry, index) => (
          <li key={`${entry.title}-${index}`} className="relative">
            <span className="absolute -left-[1.82rem] top-1.5 h-3 w-3 rounded-full border border-emerald-100 bg-[color:var(--panel-strong)] shadow-[0_0_0_4px_rgba(93,230,189,0.12)]" />
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={entry.tone}>{entry.eyebrow}</Badge>
                <span className="text-xs font-semibold uppercase text-zinc-400">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-50">{entry.title}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">
                {entry.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
