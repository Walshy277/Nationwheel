export type ForumBoard = {
  slug: string;
  name: string;
  description: string;
};

export const forumBoards: ForumBoard[] = [
  {
    slug: "general",
    name: "General",
    description: "Cross-world discussion, player talk, and general canon chatter.",
  },
  {
    slug: "diplomacy",
    name: "Diplomacy",
    description: "Treaties, negotiations, geopolitical positioning, and alliances.",
  },
  {
    slug: "canon-actions",
    name: "Canon Actions",
    description: "Action discussion, outcomes, spin calls, and lore clarification.",
  },
  {
    slug: "trade",
    name: "Trade",
    description: "Economic deals, market discussion, sanctions, and logistics.",
  },
  {
    slug: "newsroom",
    name: "Newsroom",
    description: "Reports, reactions to coverage, and world event discussion.",
  },
  {
    slug: "support",
    name: "Support",
    description: "Questions, bug reports, onboarding help, and site support.",
  },
];

export function forumBoardFromCategory(category: string) {
  return forumBoards.find(
    (board) => board.name.toLowerCase() === category.toLowerCase(),
  );
}

export function forumBoardBySlug(slug: string) {
  return forumBoards.find((board) => board.slug === slug);
}

export function normalizeForumBoard(input: string) {
  return forumBoardBySlug(input) ?? forumBoardFromCategory(input) ?? null;
}

export function forumBoardHref(category: string) {
  const board = forumBoardFromCategory(category);
  return board ? `/forums/boards/${board.slug}` : "/forums";
}
