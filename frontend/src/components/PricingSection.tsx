import { useSessionProfile } from "@/hooks/use-session-profile";

const plans = [
  {
    name: "Starter",
    price: "£0",
    period: "/month",
    features: [
      "myshowcase.site subdomain",
      "Up to 3 pieces",
      "Basic customization",
      "Mobile-ready portfolio",
    ],
    highlighted: false,
  },
  {
    name: "Portfolio",
    price: "£5",
    period: "/month",
    features: [
      "Everything in Starter",
      "Optional custom domain",
      "Unlimited pieces",
      "Priority support",
    ],
    highlighted: true,
  },
];

const PricingSection = () => {
  const { isLoggedIn, dashboardPath } = useSessionProfile();

  return (
    <section id="pricing" className="py-28 md:py-40 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-5">
          Simple pricing
        </h2>
        <p className="text-muted-foreground font-light text-lg leading-relaxed mb-14 md:mb-16 max-w-2xl">
          Start free and upgrade when you are ready. No hidden fees, cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`p-8 md:p-10 border bg-background ${
                plan.highlighted ? "border-foreground" : "border-border"
              }`}
            >
              <h3 className="font-heading text-2xl text-foreground mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-8">
                <span className="font-heading text-4xl text-foreground">{plan.price}</span>
                {plan.period ? (
                  <span className="text-sm text-muted-foreground font-light">{plan.period}</span>
                ) : null}
              </div>

              <ul className="space-y-3 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground font-light">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary shrink-0">
                      <path
                        d="M2.5 7.5L5.5 10.5L11.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={plan.highlighted ? (dashboardPath ?? (isLoggedIn ? "/onboarding" : "/start")) : "/start"}
                className={`block text-center text-sm py-3 transition-all ${
                  plan.highlighted
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                {plan.highlighted ? (isLoggedIn ? "Upgrade" : "Get started") : "Start free"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
