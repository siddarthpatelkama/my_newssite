import Link from "next/link";

const links = [
  { href: "/", label: "Edition" },
  { href: "/feed", label: "Feed" },
  { href: "/search", label: "Search" },
  { href: "/saved", label: "Saved" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader() {
  return (
    <header className="mb-10">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-mute">
        <span>Personal intelligence</span>
        <span>Source-linked · Not a rumor mill</span>
      </div>
      <div className="mt-4 border-y-2 border-ink py-5 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.42em] text-crimson">SignalOS</p>
        <Link href="/" className="font-serif text-5xl leading-none tracking-tight sm:text-7xl">
          The Daily Signal
        </Link>
        <p className="mt-3 font-serif text-lg italic text-mute">Your newsletters, edited into one paper.</p>
      </div>
      <nav className="flex flex-wrap justify-center gap-5 border-b border-rule py-3 text-[12px] uppercase tracking-[0.22em]">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-crimson">
            {link.label}
          </Link>
        ))}
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="hover:text-crimson">Sign out</button>
        </form>
      </nav>
    </header>
  );
}
