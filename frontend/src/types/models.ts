export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Plan {
  id: "free" | "pro";
  name: string;
  pieceLimit: number | null;
  monthlyPrice: number;
}

export interface Domain {
  id: string;
  type: "SUBDOMAIN" | "CUSTOM";
  hostname: string;
  verified: boolean;
  isPrimary: boolean;
}

export interface Tenant {
  id: string;
  ownerUserId: string;
  planId: "free" | "pro";
  name: string;
  slug: string;
  bio: string | null;
  contactEmail: string;
  socialLinks: Record<string, string>;
  theme: Record<string, string>;
  tenantCode: string;
  published: boolean;
  publishedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  domains?: Domain[];
  _count?: {
    pieces: number;
  };
}

export interface Piece {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  category: string | null;
  images: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMeResponse {
  user: User;
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    planId: "free" | "pro";
    published: boolean;
    publishedUrl: string | null;
  }>;
}

export interface CheckoutSession {
  id: string;
  tenantId: string;
  targetPlanId: "pro";
  provider: string;
  providerRef: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  checkoutUrl: string;
  createdAt: string;
  completedAt: string | null;
}

export interface PublicTenantView {
  tenant: {
    id: string;
    slug: string;
    name: string;
    bio: string | null;
    theme: Record<string, string>;
    socialLinks: Record<string, string>;
    published: boolean;
    publishedUrl: string | null;
  };
  pieces: Array<{
    title: string;
    slug: string;
    description: string | null;
    year: number | null;
    category: string | null;
    images: string[];
  }>;
}

export interface ApiErrorPayload {
  error: string;
}
