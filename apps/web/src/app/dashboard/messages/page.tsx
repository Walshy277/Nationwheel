import {
  createNationMessageAction,
  markNationMessageReadAction,
} from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

export default async function DashboardMessagesPage() {
  const user = await requirePageUser();
  const [myNations, allNations, received, sent] = await Promise.all([
    getPrisma().nation.findMany({
      where: { leaderUserId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getPrisma().nationMessage.findMany({
      where: { toNation: { leaderUserId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        fromNation: { select: { name: true } },
        toNation: { select: { name: true } },
      },
    }),
    getPrisma().nationMessage.findMany({
      where: { fromNation: { leaderUserId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        fromNation: { select: { name: true } },
        toNation: { select: { name: true } },
      },
    }),
  ]);

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Private Messages</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Nation Messages
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Send private diplomatic notes between linked nations. Messages are
          visible to the sending and receiving nation leaders.
        </p>
      </div>

      <Panel className="bg-[color:var(--panel-strong)]/85">
        <h2 className="text-2xl font-bold text-zinc-50">Send Message</h2>
        {myNations.length ? (
          <form
            action={createNationMessageAction}
            className="mt-5 grid gap-3 lg:grid-cols-2"
          >
            <select name="fromNationId" required className="px-3 py-2">
              {myNations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  From {nation.name}
                </option>
              ))}
            </select>
            <select name="toNationId" required className="px-3 py-2">
              <option value="">Choose recipient nation</option>
              {allNations
                .filter((nation) => !myNations.some((mine) => mine.id === nation.id))
                .map((nation) => (
                  <option key={nation.id} value={nation.id}>
                    {nation.name}
                  </option>
                ))}
            </select>
            <input
              name="subject"
              required
              maxLength={140}
              placeholder="Subject"
              className="px-3 py-2 lg:col-span-2"
            />
            <textarea
              name="body"
              required
              maxLength={5000}
              placeholder="Private message. BBCode works here: [b]bold[/b], [quote]text[/quote], [url=https://example.com]link[/url]."
              className="min-h-40 p-3 lg:col-span-2"
            />
            <button className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-200 lg:col-span-2">
              Send Message
            </button>
          </form>
        ) : (
          <p className="mt-3 text-zinc-300">
            You need a linked nation before you can send private messages.
          </p>
        )}
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Inbox</h2>
          <Badge tone="warning">
            {received.filter((message) => !message.readAt).length} unread
          </Badge>
        </div>
        {received.map((message) => (
          <Panel
            key={message.id}
            className={message.readAt ? undefined : "border-amber-300/35"}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={message.readAt ? "neutral" : "warning"}>
                    {message.readAt ? "Read" : "Unread"}
                  </Badge>
                  <Badge>From {message.fromNation.name}</Badge>
                  <Badge>To {message.toNation.name}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold text-zinc-50">
                  {message.subject}
                </h3>
                <p className="mt-2 text-xs text-zinc-500">
                  {message.createdAt.toLocaleString("en-GB")}
                </p>
              </div>
              {!message.readAt ? (
                <form action={markNationMessageReadAction.bind(null, message.id)}>
                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                    Mark read
                  </button>
                </form>
              ) : null}
            </div>
            <div className="mt-4">
              <WikiRenderer content={message.body} />
            </div>
          </Panel>
        ))}
        {received.length === 0 ? (
          <Panel className="text-zinc-300">No private messages yet.</Panel>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Sent</h2>
          <Badge>{sent.length}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {sent.map((message) => (
            <Panel key={message.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>To {message.toNation.name}</Badge>
                <Badge>{message.readAt ? "Read" : "Unread"}</Badge>
              </div>
              <h3 className="mt-3 text-lg font-bold text-zinc-50">
                {message.subject}
              </h3>
              <p className="mt-2 text-xs text-zinc-500">
                {message.createdAt.toLocaleString("en-GB")}
              </p>
              <div className="mt-3 line-clamp-4">
                <WikiRenderer content={message.body} />
              </div>
            </Panel>
          ))}
          {sent.length === 0 ? (
            <Panel className="text-zinc-300">No sent messages yet.</Panel>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
