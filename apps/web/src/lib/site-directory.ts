export type SiteDirectoryLink = {
  href: string;
  label: string;
  detail: string;
};

export type SiteDirectoryGroup = {
  title: string;
  detail: string;
  links: SiteDirectoryLink[];
};

export const primaryNavLinks: SiteDirectoryLink[] = [
  {
    href: "/nations",
    label: "Nations",
    detail: "Profiles, wiki pages, leaders, stats, and comparison tools.",
  },
  {
    href: "/actions",
    label: "Actions",
    detail: "Ongoing canon actions, spin requirements, and outcomes.",
  },
  {
    href: "/news",
    label: "News",
    detail: "Published reports, announcements, and the news ticker.",
  },
  {
    href: "/forums",
    label: "Forums",
    detail: "Discuss canon, diplomacy, trade, news, and support.",
  },
  {
    href: "/map",
    label: "Map",
    detail: "Season 1 world reference map.",
  },
];

export const publicDirectoryGroups: SiteDirectoryGroup[] = [
  {
    title: "Explore",
    detail: "Start with the live state of the world.",
    links: [
      primaryNavLinks[0]!,
      primaryNavLinks[1]!,
      primaryNavLinks[2]!,
      primaryNavLinks[3]!,
      primaryNavLinks[4]!,
    ],
  },
  {
    title: "Canon Library",
    detail: "Reference pages for setting context and continuity.",
    links: [
      {
        href: "/lore",
        label: "World Lore",
        detail: "Merged universe lore, canon rules, factions, and timeline.",
      },
      {
        href: "/wars",
        label: "Wars",
        detail: "Active wars, frozen conflicts, and peace outcomes.",
      },
      {
        href: "/activity-archive",
        label: "Activity Archive",
        detail: "Older activity feed and tracker history.",
      },
    ],
  },
  {
    title: "Analysis Tools",
    detail: "Ranking, comparison, and Discord helper pages.",
    links: [
      {
        href: "/leaderboards",
        label: "Leaderboards",
        detail: "Rank GDP, population, land, HDI, and army.",
      },
      {
        href: "/nations#compare",
        label: "Compare Nations",
        detail: "Compare two to four nations side by side.",
      },
      {
        href: "/activity",
        label: "Bot Index",
        detail: "Discord-friendly command center links.",
      },
    ],
  },
];

export const dashboardDirectoryGroups: SiteDirectoryGroup[] = [
  {
    title: "Player Hub",
    detail: "Signed-in pages for leaders and community members.",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        detail: "Signed-in home for leaders and staff.",
      },
      {
        href: "/dashboard/wiki",
        label: "My Nation",
        detail:
          "Edit your linked nation wiki, leader name, and profile picture.",
      },
      {
        href: "/dashboard/actions",
        label: "My Actions",
        detail: "Track actions and outcomes for your linked nation.",
      },
      {
        href: "/dashboard/inbox",
        label: "Postal Service",
        detail: "Tracked diplomatic mail, staff edits, and action notices.",
      },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        detail: "Staff updates, action changes, and unread alerts.",
      },
    ],
  },
];

export const staffDirectoryGroups: SiteDirectoryGroup[] = [
  {
    title: "Lore Team",
    detail: "Canon review, action tracking, and world pages.",
    links: [
      {
        href: "/lorecp",
        label: "LoreCP",
        detail: "Nation review, world clock, and lore tools.",
      },
      {
        href: "/lorecp/actions#create-action",
        label: "Create Action",
        detail: "Track a new canon action.",
      },
      {
        href: "/lorecp/actions",
        label: "Action Tracker",
        detail: "Update, complete, archive, and apply stat outcomes.",
      },
      {
        href: "/lorecp/pages/lore",
        label: "Edit World Lore",
        detail: "Maintain the public lore page.",
      },
    ],
  },
  {
    title: "Publishing",
    detail: "News and public announcements.",
    links: [
      {
        href: "/newscp",
        label: "NewsCP",
        detail: "Publish and edit reports.",
      },
      {
        href: "/lorecp/pages/announcements",
        label: "Announcements",
        detail: "Edit the public announcement/ticker text.",
      },
    ],
  },
  {
    title: "Admin",
    detail: "Site management and audit tools.",
    links: [
      {
        href: "/admincp",
        label: "AdminCP",
        detail: "Admin overview and shortcuts.",
      },
      {
        href: "/admincp/users",
        label: "Users & Roles",
        detail: "Assign roles, Discord IDs, and nation controllers.",
      },
      {
        href: "/admincp/nations",
        label: "Nation Management",
        detail: "Create nations, edit stats, and update any wiki.",
      },
      {
        href: "/admincp/logs",
        label: "Logs",
        detail: "Readable audit history.",
      },
    ],
  },
];

export const dashboardDirectoryLinks = dashboardDirectoryGroups.flatMap(
  (group) => group.links,
);

export const allPublicDirectoryLinks = publicDirectoryGroups.flatMap(
  (group) => group.links,
);

export const allStaffDirectoryLinks = staffDirectoryGroups.flatMap(
  (group) => group.links,
);
