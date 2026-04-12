import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { updatePublicLorePageAction } from "@/app/actions";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { getPublicContentPage, isPublicContentKey } from "@/lib/public-content";
import { requirePageRole } from "@/lib/permissions";

const links = [
  { href: "/lorecp", label: "Nation Review" },
  { href: "/lorecp/actions", label: "Action Tracker" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
];

export default async function PublicPageEditor({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requirePageRole([Role.LORE, Role.ADMIN]);
  const { key } = await params;
  if (!isPublicContentKey(key)) notFound();
  const page = await getPublicContentPage(key);

  return (
    <ControlLayout title="LoreCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <Badge tone="warning">Public Page Editor</Badge>
          <h1 className="mt-4 text-3xl font-black text-zinc-50">
            Edit {page.title}
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            This content is public. Use clear headings, short updates, and keep
            canon decisions easy for players to follow.
          </p>
        </Panel>

        <Panel>
          <form
            action={updatePublicLorePageAction.bind(null, key)}
            className="grid gap-4"
          >
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">
              Page title
              <input
                name="title"
                required
                defaultValue={page.title}
                className="px-3 py-2 font-normal text-zinc-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">
              Public content
              <textarea
                name="content"
                required
                defaultValue={page.content}
                className="min-h-[560px] p-4 font-mono text-sm leading-7 text-zinc-100"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-amber-300 px-5 py-3 font-bold text-zinc-950 hover:bg-amber-200">
                Save Public Page
              </button>
              <a
                href={`/${key}`}
                className="rounded-lg border border-white/10 px-5 py-3 font-bold text-zinc-100 hover:bg-white/5"
              >
                Open Public Page
              </a>
            </div>
          </form>
        </Panel>
      </div>
    </ControlLayout>
  );
}
