import { Panel } from "@/components/ui/shell";

export function DatabaseRequired({
  title = "Database Required",
}: {
  title?: string;
}) {
  return (
    <Panel>
      <h2 className="text-2xl font-black text-zinc-50">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
        This control surface is available and role-protected, but editing needs
        a production `DATABASE_URL`. Public canon pages still render from the
        bundled canon data until the database is connected.
      </p>
    </Panel>
  );
}
