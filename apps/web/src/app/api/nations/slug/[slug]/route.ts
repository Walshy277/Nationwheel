import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";
import { getPrisma } from "@/lib/prisma";
import { withCanonMetadata } from "@/lib/nations";
import { jsonError } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const nation = await getPrisma().nation.findUnique({
      where: { slug },
      include: {
        leaderUser: { select: { id: true, name: true, email: true } },
        wiki: true,
      },
    });

    if (!nation)
      return Response.json({ error: "Nation not found" }, { status: 404 });
    return Response.json({ nation: withCanonMetadata(nation) });
  } catch (error) {
    const { slug } = await params;
    const canonNation = canonNations.find(
      (candidate) => candidate.slug === slug,
    );
    if (!canonNation) return jsonError(error);

    return Response.json({
      nation: {
        ...canonNation,
        id: `canon-${canonNation.slug}`,
        leaderUser: null,
        wiki: { content: createNationWikiTemplate(canonNation) },
      },
    });
  }
}
