import { useSessionProfile } from "@/hooks/use-session-profile";

const plans = [
  {
    name: "Starter",
    price: "\u00A30",
    period: "/month",
    features: [
      "myshowcase.site subdomain",
      "Up to 3 pieces",
      "Basic customization",
      "Mobile-ready portfolio",
    ],
    highlighted: false,
    paid: false,
  },
  {
    name: "Personal",
    price: "\u00A35",
    period: "/month",
    features: [
      "Everything in Starter",
      "Up to 50 pieces",
      "More theme options",
      "Priority support",
    ],
    highlighted: true,
    paid: true,
  },
  {
    name: "Studio",
    price: "\u00A312",
    period: "/month",
    features: [
      "Everything in Personal",
      "Up to 200 pieces",
      "Team availability",
      "Custom domain support",
    ],
    highlighted: false,
    paid: true,
  },
];

const PricingSection = () => {
  const { isLoggedIn, dashboardPath } = useSessionProfile();

  return (
    <section id="pricing" className="border-t border-border py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="mb-5 font-heading text-4xl font-light text-foreground md:text-5xl">
          Simple pricing
        </h2>
        <p className="mb-14 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:mb-16">
          Start free and upgrade when you are ready. No hidden fees, cancel anytime.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const href = plan.paid ? dashboardPath ?? (isLoggedIn ? "/onboarding" : "/start") : "/start";
            const label = plan.paid ? (isLoggedIn ? "Upgrade" : "Get started") : "Start free";

            return (
              <div
                key={plan.name}
                className={`border bg-background p-8 md:p-10 ${
                  plan.highlighted ? "border-foreground" : "border-border"
                }`}
              >
                <h3 className="mb-1 font-heading text-2xl text-foreground">{plan.name}</h3>
                <div className="mb-8 flex items-baseline gap-0.5">
                  <span className="font-heading text-4xl text-foreground">{plan.price}</span>
                  <span className="text-sm font-light text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mb-10 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm font-light text-muted-foreground">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-primary">
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
                  href={href}
                  className={`block py-3 text-center text-sm transition-all ${
                    plan.highlighted
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {label}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
