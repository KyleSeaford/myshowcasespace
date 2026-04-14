export type AuthUser = {
  id: string;
  email: string;
  passwordChangeRequired: boolean;
  createdAt: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  planId: string;
  themeId: string;
  themeLocked: boolean;
  published: boolean;
  publishedUrl: string | null;
  userRole?: "OWNER" | "MEMBER";
};

export type TenantThemeId = "default" | "sunny" | "dark";

export type AuthConfig = {
  hcaptcha: {
    enabled: boolean;
    siteKey: string | null;
  };
};

export type TenantDetails = TenantSummary & {
  bio: string | null;
  contactEmail: string;
  plan?: {
    id: string;
    name: string;
    pieceLimit: number | null;
    monthlyPrice: number;
  };
  _count?: {
    pieces: number;
  };
  socialLinks: Record<string, string>;
  theme: Record<string, string>;
  teamMembers?: TenantTeamMember[];
};

export type TenantTeamMember = {
  id: string;
  userId: string;
  email: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
};

export type UploadedImage = {
  url: string;
  directUrl?: string;
  fileName: string;
  size: number;
  contentType: string;
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
  const hasJsonBody = body !== undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...headers,
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {})
    },
    body: hasJsonBody ? JSON.stringify(body) : undefined
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

export async function signup(
  email: string,
  password: string,
  acceptedLegal: boolean,
  captchaToken?: string
): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      acceptedLegal,
      ...(captchaToken ? { captchaToken } : {})
    }
  });
  return payload.user;
}

export async function login(
  email: string,
  password: string,
  acceptedLegal: boolean,
  captchaToken?: string
): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
      acceptedLegal,
      ...(captchaToken ? { captchaToken } : {})
    }
  });
  return payload.user;
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", {
    method: "POST"
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/auth/change-password", {
    method: "POST",
    body: {
      currentPassword,
      newPassword
    }
  });
  return payload.user;
}

export async function getMe(): Promise<{ user: AuthUser; tenants: TenantSummary[] }> {
  return request<{ user: AuthUser; tenants: TenantSummary[] }>("/auth/me");
}

export async function getAuthConfig(): Promise<AuthConfig> {
  return request<AuthConfig>("/auth/config");
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

export type TenantUpdatePayload = {
  bio?: string | null;
  contactEmail?: string;
  socialLinks?: Record<string, string>;
  theme?: Record<string, string>;
  adminPassword?: string;
};

export async function getTenant(tenantId: string): Promise<TenantDetails> {
  const payload = await request<{ tenant: TenantDetails | null }>(`/tenants/${tenantId}`);
  if (!payload.tenant) {
    throw new ApiError(404, "Tenant not found");
  }
  return payload.tenant;
}

export async function updateTenant(tenantId: string, payload: TenantUpdatePayload): Promise<TenantDetails> {
  const response = await request<{ tenant: TenantDetails }>(`/tenants/${tenantId}`, {
    method: "PATCH",
    body: payload
  });
  return response.tenant;
}

export async function updateTenantTheme(tenantId: string, themeId: TenantThemeId): Promise<TenantDetails> {
  const response = await request<{ tenant: TenantDetails | null }>(`/tenants/${tenantId}/theme`, {
    method: "PATCH",
    body: {
      themeId
    }
  });

  if (!response.tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  return response.tenant;
}

export async function inviteTenantMember(
  tenantId: string,
  email: string
): Promise<{
  invitation: {
    id: string;
    email: string;
    temporaryAccount: boolean;
    emailSent: boolean;
  };
  member: TenantTeamMember;
  tenant: TenantDetails | null;
  temporaryPassword?: string;
}> {
  return request<{
    invitation: {
      id: string;
      email: string;
      temporaryAccount: boolean;
      emailSent: boolean;
    };
    member: TenantTeamMember;
    tenant: TenantDetails | null;
    temporaryPassword?: string;
  }>(`/tenants/${tenantId}/team-invitations`, {
    method: "POST",
    body: {
      email
    }
  });
}

type UploadImageOptions = {
  tenantId?: string;
  tenantSlug?: string;
};

export async function uploadImage(file: File, options?: UploadImageOptions): Promise<UploadedImage> {
  const formData = new FormData();
  if (options?.tenantId) {
    formData.append("tenantId", options.tenantId);
  }
  if (options?.tenantSlug) {
    formData.append("tenantSlug", options.tenantSlug);
  }
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiError(response.status, payload?.error ?? payload?.message ?? "Image upload failed");
  }

  return (await response.json()) as UploadedImage;
}

export async function publishTenant(tenantId: string): Promise<{ published: boolean; publishedUrl: string }> {
  return request<{ published: boolean; publishedUrl: string }>(`/tenants/${tenantId}/publish`, {
    method: "POST"
  });
}
