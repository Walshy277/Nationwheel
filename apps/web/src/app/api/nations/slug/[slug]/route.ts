import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!process.env.DATABASE_URL) {
    const canonNation = canonNations.find(
      (candidate) => candidate.slug === slug,
    );

    if (!canonNation) {
      return Response.json({ error: "Nation not found" }, { status: 404 });
    }

    return Response.json({
      nation: {
        ...canonNation,
        id: `canon-${canonNation.slug}`,
        leaderUser: null,
        wiki: { content: createNationWikiTemplate(canonNation) },
      },
    });
  }

  try {
    const [{ getPrisma }, { withCanonMetadata }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/nations"),
    ]);
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
    const canonNation = canonNations.find(
      (candidate) => candidate.slug === slug,
    );
    if (!canonNation) {
      console.error(error);
      return Response.json(
        { error: "Unexpected server error" },
        { status: 500 },
      );
    }

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
