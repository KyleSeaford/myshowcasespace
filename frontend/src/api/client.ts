import type {
  ApiErrorPayload,
  AuthMeResponse,
  CheckoutSession,
  Piece,
  PublicTenantView,
  Tenant,
  User
} from "../types/models";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = (await response.json()) as Partial<ApiErrorPayload>;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // no-op
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function signup(email: string, password: string): Promise<{ user: User }> {
  return request<{ user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  return request<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function logout(): Promise<void> {
  return request<void>("/auth/logout", {
    method: "POST"
  });
}

export async function getMe(): Promise<AuthMeResponse> {
  return request<AuthMeResponse>("/auth/me");
}

export async function listTenants(): Promise<{ tenants: Tenant[] }> {
  return request<{ tenants: Tenant[] }>("/tenants");
}

export interface TenantCreateInput {
  name: string;
  slug: string;
  bio?: string;
  contactEmail: string;
  socialLinks?: Record<string, string>;
  theme?: Record<string, string>;
}

export async function createTenant(input: TenantCreateInput): Promise<{ tenant: Tenant; apiKey: string }> {
  return request<{ tenant: Tenant; apiKey: string }>("/tenants", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getTenant(tenantId: string): Promise<{ tenant: Tenant }> {
  return request<{ tenant: Tenant }>(`/tenants/${tenantId}`);
}

export interface TenantUpdateInput {
  name?: string;
  bio?: string | null;
  contactEmail?: string;
  socialLinks?: Record<string, string>;
  theme?: Record<string, string>;
}

export async function updateTenant(tenantId: string, input: TenantUpdateInput): Promise<{ tenant: Tenant }> {
  return request<{ tenant: Tenant }>(`/tenants/${tenantId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function publishTenant(tenantId: string): Promise<{ published: boolean; publishedUrl: string }> {
  return request<{ published: boolean; publishedUrl: string }>(`/tenants/${tenantId}/publish`, {
    method: "POST"
  });
}

export async function listPieces(tenantId: string): Promise<{ pieces: Piece[] }> {
  return request<{ pieces: Piece[] }>(`/tenants/${tenantId}/pieces`);
}

export interface PieceInput {
  title: string;
  slug: string;
  description?: string;
  year?: number;
  category?: string;
  images: string[];
  published?: boolean;
}

export async function createPiece(tenantId: string, input: PieceInput): Promise<{ piece: Piece }> {
  return request<{ piece: Piece }>(`/tenants/${tenantId}/pieces`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deletePiece(tenantId: string, pieceId: string): Promise<void> {
  return request<void>(`/tenants/${tenantId}/pieces/${pieceId}`, {
    method: "DELETE"
  });
}

export async function togglePiecePublished(tenantId: string, pieceId: string, publish: boolean): Promise<{ piece: Piece }> {
  return request<{ piece: Piece }>(`/tenants/${tenantId}/pieces/${pieceId}/${publish ? "publish" : "unpublish"}`, {
    method: "POST"
  });
}

export async function createCheckoutSession(tenantId: string): Promise<{ checkoutSession: CheckoutSession }> {
  return request<{ checkoutSession: CheckoutSession }>(`/tenants/${tenantId}/billing/checkout-sessions`, {
    method: "POST",
    body: JSON.stringify({
      targetPlanId: "pro",
      successUrl: `${window.location.origin}/app?billing=success`,
      cancelUrl: `${window.location.origin}/app?billing=cancel`
    })
  });
}

export async function completeCheckoutSession(
  tenantId: string,
  sessionId: string
): Promise<{ tenant: { id: string; planId: "free" | "pro" }; completedAt: string }> {
  return request<{ tenant: { id: string; planId: "free" | "pro" }; completedAt: string }>(
    `/tenants/${tenantId}/billing/checkout-sessions/${sessionId}/complete`,
    {
      method: "POST"
    }
  );
}

export async function setCustomDomain(tenantId: string, hostname: string): Promise<{ domain: unknown }> {
  return request<{ domain: unknown }>(`/tenants/${tenantId}/domains/custom`, {
    method: "PUT",
    body: JSON.stringify({ hostname })
  });
}

export async function fetchPublicPreview(slug: string): Promise<PublicTenantView> {
  return request<PublicTenantView>(`/public/sites/${slug}`);
}
