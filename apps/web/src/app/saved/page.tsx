import { DefaultShell } from "@/components/layout/DefaultShell";

export const dynamic = "force-dynamic";

export default function SavedPage() {
  return (
    <DefaultShell>
      <main className="max-w-2xl">
        <h1 className="font-serif text-4xl">Saved stories</h1>
        <p className="mt-4 leading-7 text-ink/80">
          Saving stories is not available yet. This page will be enabled after saved-story accounts are implemented.
        </p>
      </main>
    </DefaultShell>
  );
}
