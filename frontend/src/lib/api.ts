export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  planId: string;
  published: boolean;
  publishedUrl: string | null;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiError(response.status, payload?.error ?? payload?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: { email, password }
  });
  return payload.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  return payload.user;
}

export async function getMe(): Promise<{ user: AuthUser; tenants: TenantSummary[] }> {
  return request<{ user: AuthUser; tenants: TenantSummary[] }>("/auth/me");
}

export type TenantCreatePayload = {
  name: string;
  slug: string;
  bio?: string;
  contactEmail: string;
  adminPassword: string;
  socialLinks?: Record<string, string>;
  theme?: Record<string, string>;
};

export async function createTenant(payload: TenantCreatePayload): Promise<{ tenant: TenantSummary; apiKey: string }> {
  return request<{ tenant: TenantSummary; apiKey: string }>("/tenants", {
    method: "POST",
    body: payload
  });
}

export async function publishTenant(tenantId: string): Promise<{ published: boolean; publishedUrl: string }> {
  return request<{ published: boolean; publishedUrl: string }>(`/tenants/${tenantId}/publish`, {
    method: "POST"
  });
}