import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

const links = [
  { href: "/admincp/nations", label: "Nations" },
  { href: "/admincp/users", label: "Users" },
  { href: "/admincp/map", label: "Map" },
  { href: "/admincp/logs", label: "Logs" },
];

export default async function AdminMapPage() {
  await requirePageRole([Role.ADMIN]);

  return (
    <ControlLayout title="AdminCP" links={links}>
      <Panel>
        <h1 className="text-3xl font-black text-white">Map Assets</h1>
        <p className="mt-3 text-slate-300">
          The map is managed as a still Season 1 reference image in the project
          assets folder.
        </p>
      </Panel>
    </ControlLayout>
  );
}
