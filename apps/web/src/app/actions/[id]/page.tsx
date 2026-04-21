import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionDetailPanel } from "@/components/actions/action-detail-panel";
import { Badge, PageShell } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const action = await getPrisma().loreAction.findUnique({
    where: { id },
    select: { type: true, nation: { select: { name: true } } },
  });

  if (!action) return { title: "Action" };

  return {
    title: `${action.nation.name} ${action.type}`,
    description: "Canon action detail, updates, and current status.",
    alternates: { canonical: `/actions/${id}` },
  };
}

export default async function PublicActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const action = await getPrisma().loreAction.findUnique({
    where: { id },
    include: {
      nation: { select: { name: true, slug: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        include: { createdByUser: { select: { name: true, email: true } } },
      },
    },
  });

  if (!action) notFound();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Action Detail</Badge>
      </div>
      <ActionDetailPanel
        action={action}
        backHref="/actions"
        backLabel="Back to canon tracker"
      />
    </PageShell>
  );
}
