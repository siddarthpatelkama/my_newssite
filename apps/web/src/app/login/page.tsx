import { LoginForm } from "@/components/auth/LoginForm";
import { authConfigured } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto max-w-xl py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-crimson">Private reading room</p>
      <h1 className="mt-3 font-serif text-5xl">SignalOS</h1>
      <p className="mt-4 leading-7 text-ink/75">Sign in to your personal newsletter intelligence desk.</p>
      {authConfigured() ? (
        <LoginForm nextPath={next ?? "/"} />
      ) : (
        <p className="mt-8 border border-rule p-5 text-sm leading-7">
          Site setup is incomplete. Configure <code>APP_PASSWORD</code> and <code>APP_SESSION_SECRET</code> in this deployment&apos;s environment settings, then redeploy.
        </p>
      )}
    </main>
  );
}
