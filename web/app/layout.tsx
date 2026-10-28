import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { Nav, StaticNav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "app-check", template: "%s · app-check" },
  description: "App-Marktdaten für iOS und Android aus eigener Erhebung (Prototyp)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans md:flex-row">
        <aside className="flex shrink-0 flex-col gap-6 border-b border-border bg-bg/70 px-4 py-4 backdrop-blur md:sticky md:top-0 md:h-screen md:w-60 md:border-r md:border-b-0 md:py-6">
          <Link href="/explore" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#b9adff] to-[#6d4dff] text-sm font-bold text-white shadow-[0_0_20px_-4px_rgb(124_92_255/0.8)]">ac</span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight">app-check</span>
              <span className="block text-xs text-muted">Arbeitstitel · Prototyp</span>
            </span>
          </Link>
          <Suspense fallback={<StaticNav />}>
            <Nav />
          </Suspense>
          <p className="mt-auto hidden text-xs leading-relaxed text-muted md:block">
            Daten aus App Store und Google Play, eigene tägliche Erhebung. Downloads und Umsatz sind Schätzungen mit Spanne.
          </p>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </body>
    </html>
  );
}
