import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio7 from "@/assets/portfolio-7.jpg";
import { useSessionProfile } from "@/hooks/use-session-profile";

const HeroSection = () => {
  const { isLoggedIn, dashboardPath } = useSessionProfile();
  const primaryHref = isLoggedIn ? (dashboardPath ?? "/onboarding") : "/start";
  const primaryLabel = isLoggedIn ? (dashboardPath ? "Go to dashboard" : "Continue setup") : "Start";

  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center py-20 lg:py-0">
        {/* Left content */}
        <div className="space-y-8 animate-fade-in">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-foreground">
            Build your portfolio.
            <br />
            Show your work.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-light max-w-md leading-relaxed">
            A simple way to create a clean, professional portfolio website.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href={primaryHref}
              className="inline-flex items-center px-7 py-3 text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {primaryLabel}
            </a>
            <a
              href="/#showcase"
              className="inline-flex items-center px-7 py-3 text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              View examples
            </a>
          </div>
        </div>

        {/* Right - portfolio mockup grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div className="space-y-3">
            <img src={portfolio1} alt="Architecture photography" className="w-full object-cover aspect-[4/5]" width={800} height={1000} />
            <img src={portfolio2} alt="Still life photography" className="w-full object-cover aspect-square" loading="lazy" width={800} height={800} />
          </div>
          <div className="space-y-3 pt-8">
            <img src={portfolio3} alt="Landscape photography" className="w-full object-cover aspect-[3/2]" loading="lazy" width={1000} height={700} />
            <img src={portfolio7} alt="Product photography" className="w-full object-cover aspect-square" loading="lazy" width={800} height={800} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
