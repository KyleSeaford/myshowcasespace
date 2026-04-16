import { useState } from "react";
import { useSessionProfile } from "@/hooks/use-session-profile";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, dashboardPath } = useSessionProfile();
  const primaryHref = isLoggedIn ? (dashboardPath ?? "/onboarding") : "/start";
  const primaryLabel = isLoggedIn ? (dashboardPath ? "Go to dashboard" : "Continue setup") : "Start";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        <a href="/" className="font-heading text-xl tracking-wide text-foreground">
          Rivo
        </a>

        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#showcase" className="hover:text-foreground transition-colors">Examples</a>
          <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <a href="/blog" className="hover:text-foreground transition-colors">Blog</a>
        </nav>

        <a
          href={primaryHref}
          className="hidden md:inline-flex items-center px-5 py-2 text-sm border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          {primaryLabel}
        </a>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border px-6 py-6 bg-background space-y-4">
          <a href="/#features" className="block text-sm text-muted-foreground">Features</a>
          <a href="/#showcase" className="block text-sm text-muted-foreground">Examples</a>
          <a href="/pricing" className="block text-sm text-muted-foreground">Pricing</a>
          <a href="/about" className="block text-sm text-muted-foreground">About</a>
          <a href="/blog" className="block text-sm text-muted-foreground">Blog</a>
          {isLoggedIn ? <a href="/account" className="block text-sm text-muted-foreground">Account</a> : null}
          <a href={primaryHref} className="block text-sm text-foreground border border-foreground px-4 py-2 text-center mt-4">
            {primaryLabel}
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
