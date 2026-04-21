import { AlertCategory } from "@prisma/client";

export const alertPreferenceOptions: Array<{
  category: AlertCategory;
  label: string;
  detail: string;
}> = [
  {
    category: AlertCategory.MAIL,
    label: "Postal Mail",
    detail: "Private diplomatic mail and delivery alerts.",
  },
  {
    category: AlertCategory.ACTION_STATUS,
    label: "Action Status",
    detail: "Action created, completed, restored, or moved between statuses.",
  },
  {
    category: AlertCategory.ACTION_UPDATE,
    label: "Action Updates",
    detail: "Daily lore team updates added to tracked canon actions.",
  },
  {
    category: AlertCategory.WIKI_EDIT,
    label: "Wiki Edits",
    detail: "Staff edits to your nation wiki content.",
  },
  {
    category: AlertCategory.PROFILE_UPDATE,
    label: "Profile Updates",
    detail: "Stats, overview, profile picture, and structured profile changes.",
  },
  {
    category: AlertCategory.SPIN_RESULT,
    label: "Spin Results",
    detail: "Lore wheel outcomes saved for actions that required a spin.",
  },
];

export function alertCategoryLabel(category: AlertCategory) {
  return (
    alertPreferenceOptions.find((option) => option.category === category)?.label ??
    category
  );
}
