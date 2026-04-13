export const PLAN_IDS = {
  starterFree: "free",
  personal: "personal",
  legacyPersonal: "pro",
  studio: "studio"
} as const;

export const PAID_PLAN_IDS = [PLAN_IDS.personal, PLAN_IDS.studio] as const;
export const PAID_PLAN_ALIASES = [PLAN_IDS.personal, PLAN_IDS.legacyPersonal, PLAN_IDS.studio] as const;

export function isPaidPlanId(planId: string): planId is (typeof PAID_PLAN_ALIASES)[number] {
  return PAID_PLAN_ALIASES.includes(planId as (typeof PAID_PLAN_ALIASES)[number]);
}

export const DEFAULT_PLANS = [
  {
    id: PLAN_IDS.starterFree,
    name: "Starter Free",
    pieceLimit: 3,
    monthlyPrice: 0
  },
  {
    id: PLAN_IDS.personal,
    name: "Personal",
    pieceLimit: 50,
    monthlyPrice: 500
  },
  {
    id: PLAN_IDS.studio,
    name: "Studio",
    pieceLimit: 200,
    monthlyPrice: 1200
  }
] as const;
