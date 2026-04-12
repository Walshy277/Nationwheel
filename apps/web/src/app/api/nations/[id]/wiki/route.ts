import { getPrisma } from "@/lib/prisma";
import { jsonError, requireWikiEditAccessOrBot } from "@/lib/permissions";
import { wikiUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const wiki = await getPrisma().nationWiki.findUnique({
      where: { nationId: id },
    });

    if (!wiki)
      return Response.json({ error: "Nation wiki not found" }, { status: 404 });
    return Response.json({ wiki });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireWikiEditAccessOrBot(request, id);
    const payload = wikiUpdateSchema.parse(await request.json());
    const previous = await getPrisma().nationWiki.findUnique({
      where: { nationId: id },
    });

    const wiki = await getPrisma().nationWiki.upsert({
      where: { nationId: id },
      update: {
        content: payload.content,
        updatedByUserId: user.id ?? undefined,
      },
      create: {
        nationId: id,
        content: payload.content,
        updatedByUserId: user.id ?? undefined,
      },
    });

    await getPrisma().nationRevision.create({
      data: {
        nationId: id,
        fieldType: "WIKI",
        previousValue: { content: previous?.content ?? null },
        newValue: { content: payload.content },
        changedByUserId: user.id ?? undefined,
      },
    });

    return Response.json({ wiki });
  } catch (error) {
    return jsonError(error);
  }
}
