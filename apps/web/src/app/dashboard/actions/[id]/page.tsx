import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionDetailPanel } from "@/components/actions/action-detail-panel";
import { Badge, PageShell } from "@/components/ui/shell";
import { requirePageUser } from "@/lib/permissions";
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

  if (!action) return { title: "My Action" };

  return {
    title: `${action.nation.name} ${action.type}`,
    description: "Leader view of canon action detail and staff updates.",
  };
}

export default async function DashboardActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  const action = await getPrisma().loreAction.findUnique({
    where: { id },
    include: {
      nation: { select: { name: true, slug: true, leaderUserId: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        include: { createdByUser: { select: { name: true, email: true } } },
      },
    },
  });

  if (!action || action.nation.leaderUserId !== user.id) notFound();

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">My Action</Badge>
      </div>
      <ActionDetailPanel
        action={action}
        backHref="/dashboard/actions"
        backLabel="Back to my actions"
      />
    </PageShell>
  );
}
