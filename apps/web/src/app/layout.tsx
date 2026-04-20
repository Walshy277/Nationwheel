import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameDateBanner } from "@/components/layout/game-date-banner";
import { SideNav } from "@/components/layout/side-nav";
import { TopNav } from "@/components/layout/top-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://nation-wheel.vercel.app"),
  title: {
    default: "Nation Wheel",
    template: "%s | Nation Wheel",
  },
  description:
    "A map-first strategy world platform for nation profiles, lore, and Discord governance.",
  openGraph: {
    title: "Nation Wheel",
    description:
      "A map-first strategy world platform for nation profiles, lore, and Discord governance.",
    url: "/",
    siteName: "Nation Wheel",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nation Wheel",
    description:
      "A map-first strategy world platform for nation profiles, lore, and Discord governance.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <TopNav />
        <GameDateBanner />
        <div className="xl:grid xl:grid-cols-[280px_minmax(0,1fr)]">
          <SideNav />
          <div className="min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
