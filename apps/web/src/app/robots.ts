import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://nation-wheel.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admincp", "/lorecp", "/dashboard", "/dev", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
