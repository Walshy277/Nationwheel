import type { MetadataRoute } from "next";
import { canonNations } from "@nation-wheel/shared";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://nation-wheel.vercel.app";

const publicRoutes = [
  "",
  "/nations",
  "/leaderboards",
  "/map",
  "/news",
  "/lore",
  "/wars",
  "/actions",
  "/activity",
  "/activity-archive",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...publicRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...canonNations.map((nation) => ({
      url: `${baseUrl}/nations/${nation.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
