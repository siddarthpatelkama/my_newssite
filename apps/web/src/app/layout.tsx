import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageTelemetry } from "@/components/telemetry/PageTelemetry";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignalOS · Daily intelligence",
  description: "A personal editorial paper generated from your newsletters.",
};

// Never bake a private mailbox's stories into publicly cacheable static HTML.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased min-h-screen`}>
        <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 sm:px-8">
          <SiteHeader />
          {children}
          <SiteFooter />
          <PageTelemetry />
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
