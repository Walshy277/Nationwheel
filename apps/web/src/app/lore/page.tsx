import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { getPublicContentPage } from "@/lib/public-content";

export default async function LorePage() {
  const page = await getPublicContentPage("lore");

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">World Canon</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">{page.title}</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Public Nation Wheel canon, timeline notes, world rules, and current
          season context.
        </p>
      </div>
      <Panel>
        <WikiRenderer content={page.content} />
      </Panel>
    </PageShell>
  );
}
