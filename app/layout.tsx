import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Logic League",
  description: "知識ではなく、思考で競え。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,#111827_0%,#05070d_48%,#020204_100%)] antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
