import { useSessionProfile } from "@/hooks/use-session-profile";

const CtaSection = () => {
  const { isLoggedIn, dashboardPath } = useSessionProfile();
  const ctaHref = isLoggedIn ? (dashboardPath ?? "/onboarding") : "/start";
  const ctaLabel = isLoggedIn ? (dashboardPath ? "Go to dashboard" : "Continue setup") : "Start";

  return (
    <section id="cta" className="py-20 md:py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
          Create your portfolio
          <br />
          in minutes.
        </h2>
        <a
          href={ctaHref}
          className="inline-flex items-center px-8 py-3 text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
};

export default CtaSection;
