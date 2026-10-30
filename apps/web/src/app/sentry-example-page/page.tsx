"use client";

import { DefaultShell } from "@/components/layout/DefaultShell";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  const triggerClientError = () => {
    throw new Error("Sentry Test Error from SignalOS Client");
  };

  const triggerCapturedError = () => {
    try {
      throw new Error("Sentry Captured Exception Test from SignalOS");
    } catch (err) {
      Sentry.captureException(err);
      alert("Test exception sent to Sentry!");
    }
  };

  return (
    <DefaultShell>
      <main className="mx-auto max-w-xl py-12 text-center space-y-6">
        <h1 className="font-serif text-3xl font-bold text-ink">Sentry Verification Page</h1>
        <p className="text-sm text-mute">
          Click either button below to send a sample error event to your Sentry project (<code>my_newssite</code>).
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={triggerCapturedError}
            className="w-full sm:w-auto rounded-xl bg-crimson px-5 py-2.5 font-serif text-xs font-semibold text-paper shadow transition-all hover:opacity-90"
          >
            Send Test Exception to Sentry
          </button>

          <button
            type="button"
            onClick={triggerClientError}
            className="w-full sm:w-auto rounded-xl border border-rule bg-paper px-5 py-2.5 font-serif text-xs font-semibold text-ink shadow transition-all hover:border-ink"
          >
            Throw Sample Error
          </button>
        </div>
      </main>
    </DefaultShell>
  );
}
