import { notFound } from "next/navigation";
import { NationProfile } from "@/components/nation/nation-profile";
import { PageShell } from "@/components/ui/shell";
import { getNationProfile } from "@/lib/nations";

export default async function NationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nation = await getNationProfile(slug);

  if (!nation) notFound();

  return (
    <PageShell>
      <NationProfile nation={nation} wiki={nation.wiki} />
    </PageShell>
  );
}
