export const loreCpLinks = [
  { href: "/lorecp", label: "Nation Review" },
  { href: "/lorecp/actions", label: "Action Tracker" },
  { href: "/lorecp/wheel", label: "Wheel Desk" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
  { href: "/lorecp/pages/announcements", label: "Announcements" },
];

export const adminCpLinks = [
  { href: "/admincp", label: "Overview" },
  { href: "/admincp/users", label: "Users & Roles" },
  { href: "/admincp/nations", label: "Nations" },
  { href: "/admincp/logs", label: "Logs" },
  { href: "/admincp/map", label: "Map" },
  { href: "/lorecp/pages/announcements", label: "Announcements" },
  { href: "/newscp", label: "News Desk" },
];

export const newsCpLinks = [
  { href: "/newscp", label: "News Desk" },
  { href: "/news", label: "Public News" },
];

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
