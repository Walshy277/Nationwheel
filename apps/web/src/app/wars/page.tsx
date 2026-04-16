import type { Metadata } from "next";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { getPublicContentPage } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Wars",
  description:
    "Read active wars, frozen conflicts, outcomes, occupations, and peace terms in Nation Wheel.",
  alternates: { canonical: "/wars" },
};

export default async function WarsPage() {
  const page = await getPublicContentPage("wars");

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="warning">Public War Board</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">{page.title}</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Active wars, frozen conflicts, outcomes, occupations, and peace terms.
        </p>
      </div>
      <Panel>
        <WikiRenderer content={page.content} />
      </Panel>
    </PageShell>
  );
}
