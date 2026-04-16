export const loreCpLinks = [
  { href: "/lorecp", label: "Nation Review" },
  { href: "/lorecp/actions", label: "Action Tracker" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
];

export const adminCpLinks = [
  { href: "/admincp", label: "Overview" },
  { href: "/admincp/nations", label: "Nations" },
  { href: "/admincp/users", label: "Users" },
  { href: "/admincp/map", label: "Map" },
  { href: "/admincp/logs", label: "Logs" },
];

export const newsCpLinks = [
  { href: "/newscp", label: "Publish News" },
  { href: "/news", label: "Public News" },
];

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
