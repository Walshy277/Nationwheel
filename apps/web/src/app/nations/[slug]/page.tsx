import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NationProfile } from "@/components/nation/nation-profile";
import { PageShell } from "@/components/ui/shell";
import { getNationProfile } from "@/lib/nations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nation = await getNationProfile(slug);

  if (!nation) {
    return {
      title: "Nation Not Found",
    };
  }

  const description = `${nation.name} profile: ${nation.government}, ${nation.economy}, population ${nation.people}.`;

  return {
    title: nation.name,
    description,
    alternates: { canonical: `/nations/${nation.slug}` },
    openGraph: {
      title: nation.name,
      description,
      url: `/nations/${nation.slug}`,
      type: "article",
    },
  };
}

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
