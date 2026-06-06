import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { FloatingParticipationHub } from "@/components/layout/FloatingParticipationHub";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://logic-league.app";
const brandDescription = "知識ではなく、思考で競え";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Logic League",
  description: brandDescription,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Logic League",
    description: brandDescription,
    siteName: "Logic League",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/ogp.png",
        width: 1774,
        height: 887,
        alt: "Logic League - 知識ではなく、思考で競え",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Logic League",
    description: brandDescription,
    images: ["/ogp.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,#111827_0%,#05070d_48%,#020204_100%)] antialiased">
        <Header />
        {children}
        <FloatingParticipationHub />
      </body>
    </html>
  );
}
