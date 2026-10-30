import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PageTelemetry } from "@/components/telemetry/PageTelemetry";

export function DefaultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 sm:px-8">
        <SiteHeader />
        {children}
        <SiteFooter />
        <PageTelemetry />
      </div>
    </div>
  );
}

