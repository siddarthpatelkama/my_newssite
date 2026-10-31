import type { ThemeSpec } from "@signalos/shared";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PageTelemetry } from "@/components/telemetry/PageTelemetry";
import { getActiveThemeSpec } from "@/lib/queries";

export async function DefaultShell({
  children,
  themeSpec,
}: {
  children: React.ReactNode;
  themeSpec?: ThemeSpec | null;
}) {
  const activeSpec = themeSpec !== undefined ? themeSpec : (await getActiveThemeSpec());

  const customStyles = activeSpec
    ? ({
        "--theme-paper": activeSpec.colors.paper,
        "--theme-ink": activeSpec.colors.ink,
        "--theme-rule": activeSpec.colors.rule,
        "--theme-accent": activeSpec.colors.crimson,
        "--theme-mute": activeSpec.colors.mute,
      } as React.CSSProperties)
    : undefined;

  const atmosphere = activeSpec?.atmosphere ?? "sand_grain";

  return (
    <div
      style={customStyles}
      className={`relative min-h-screen bg-paper text-ink selection:bg-crimson selection:text-paper transition-colors duration-500 ${
        atmosphere === "cyber_grid" ? "cyber-grid-bg" : atmosphere === "sand_grain" ? "sand-grain-bg" : ""
      }`}
    >
      {/* Dynamic Atmosphere Backgrounds */}
      {atmosphere === "god_rays" ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
          <div className="absolute -top-40 left-1/4 h-[800px] w-96 rotate-12 bg-gradient-to-b from-amber-300/20 via-amber-100/5 to-transparent blur-3xl animate-god-rays" />
          <div className="absolute -top-20 right-1/4 h-[700px] w-80 -rotate-12 bg-gradient-to-b from-amber-200/15 via-white/5 to-transparent blur-3xl animate-god-rays-slow" />
        </div>
      ) : null}

      {atmosphere === "diwali_glow" ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-80 w-full max-w-4xl bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-3xl animate-flame" />
          <div className="absolute bottom-20 left-10 h-3 w-3 rounded-full bg-amber-400 blur-[2px] animate-diwali-ember-1" />
          <div className="absolute bottom-40 right-16 h-2 w-2 rounded-full bg-orange-400 blur-[1px] animate-diwali-ember-2" />
        </div>
      ) : null}

      {atmosphere === "cyber_grid" ? (
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      ) : null}

      <div className="relative z-10 mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 sm:px-8">
        <SiteHeader />
        {children}
        <SiteFooter />
        <PageTelemetry />
      </div>
    </div>
  );
}
