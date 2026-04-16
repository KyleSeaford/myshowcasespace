import { useSessionProfile } from "@/hooks/use-session-profile";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, createBillingCheckoutSession } from "@/lib/api";

const plans = [
  {
    id: "free",
    name: "Starter",
    price: "\u00A30",
    period: "/month",
    features: [
      "*.getrivo.net address",
      "Up to 3 pieces",
      "1 theme (default only)",
      "Basic customization",
    ],
    highlighted: false,
    paid: false,
  },
  {
    id: "personal",
    name: "Personal",
    price: "\u00A35",
    period: "/month",
    features: [
      "Everything in Starter",
      "Up to 50 pieces",
      "Choose from 3 themes",
      "Priority support",
    ],
    highlighted: true,
    paid: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "\u00A312",
    period: "/month",
    features: [
      "Everything in Personal",
      "Up to 200 pieces",
      "Studio team access",
      "Custom domain support - coming soon",
    ],
    highlighted: false,
    paid: true,
  },
];

function planTier(planId: string): number {
  if (planId === "studio") {
    return 2;
  }

  if (planId === "personal" || planId === "pro") {
    return 1;
  }

  return 0;
}

const PricingSection = () => {
  const { isLoggedIn, firstTenant, profile } = useSessionProfile();
  const [searchParams] = useSearchParams();
  const [busyPlanId, setBusyPlanId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const requestedTenantId = searchParams.get("tenantId")?.trim() ?? "";
  const selectedTenant =
    profile?.tenants.find((tenant) => tenant.id === requestedTenantId) ?? firstTenant ?? null;

  const handlePaidPlan = async (targetPlanId: "personal" | "studio") => {
    setErrorMessage("");

    if (!isLoggedIn) {
      window.location.href = "/start";
      return;
    }

    if (!selectedTenant) {
      window.location.href = "/onboarding";
      return;
    }

    setBusyPlanId(targetPlanId);
    try {
      const successUrl = `${window.location.origin}/settings?tenantId=${encodeURIComponent(
        selectedTenant.id
      )}&billing=success`;
      const cancelUrl = `${window.location.origin}/pricing?tenantId=${encodeURIComponent(selectedTenant.id)}`;
      const checkoutSession = await createBillingCheckoutSession(
        selectedTenant.id,
        targetPlanId,
        successUrl,
        cancelUrl
      );
      window.location.href = checkoutSession.checkoutUrl;
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to start checkout.");
    } finally {
      setBusyPlanId("");
    }
  };

  return (
    <section id="pricing" className="border-t border-border py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="mb-5 font-heading text-4xl font-light text-foreground md:text-5xl">
          Simple pricing
        </h2>
        <p className="mb-14 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:mb-16">
          Start free and upgrade when you are ready. No hidden fees, cancel anytime.
        </p>
        {errorMessage ? <p className="mb-6 text-sm text-destructive">{errorMessage}</p> : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const dashboardHref = selectedTenant
              ? `/dashboard?tenantId=${encodeURIComponent(selectedTenant.id)}`
              : "/onboarding";
            const freePlanHref = isLoggedIn ? dashboardHref : "/start";
            const targetTier = planTier(plan.id);
            const currentTier = selectedTenant ? planTier(selectedTenant.planId) : 0;
            const canUpgrade = isLoggedIn && selectedTenant ? currentTier < targetTier : false;
            const shouldGoToDashboard = isLoggedIn && selectedTenant ? currentTier >= targetTier : false;
            const isBusy = busyPlanId === plan.id;
            const label = plan.paid
              ? isBusy
                ? "Starting checkout..."
                : canUpgrade
                  ? "Upgrade"
                  : shouldGoToDashboard
                    ? "Dashboard"
                    : isLoggedIn
                      ? "Upgrade"
                      : "Get started"
              : isLoggedIn
                ? "Dashboard"
                : "Start free";

            const paidClassName = `block w-full py-3 text-center text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
              plan.highlighted
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
            }`;
            const freeClassName = `block py-3 text-center text-sm transition-all ${
              plan.highlighted
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
            }`;

            const handlePaidClick = () => {
              if (shouldGoToDashboard) {
                window.location.href = dashboardHref;
                return;
              }
              void handlePaidPlan(plan.id as "personal" | "studio");
            };

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

                {plan.paid ? (
                  <button
                    type="button"
                    onClick={handlePaidClick}
                    disabled={isBusy}
                    className={paidClassName}
                  >
                    {label}
                  </button>
                ) : (
                  <a
                    href={freePlanHref}
                    className={freeClassName}
                  >
                    {label}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
