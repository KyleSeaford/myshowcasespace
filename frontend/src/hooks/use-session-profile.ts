import { useQuery } from "@tanstack/react-query";
import { ApiError, getMe, type AuthUser, type TenantSummary } from "@/lib/api";

type SessionProfile = {
  user: AuthUser;
  tenants: TenantSummary[];
};

function buildDashboardPath(tenant: TenantSummary): string {
  const query = new URLSearchParams({
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.planId
  });

  if (tenant.publishedUrl) {
    query.set("url", tenant.publishedUrl);
  }

  return `/dashboard?${query.toString()}`;
}

export function useSessionProfile() {
  const query = useQuery<SessionProfile | null>({
    queryKey: ["session-profile"],
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false
  });

  const firstTenant = query.data?.tenants?.[0] ?? null;

  return {
    profile: query.data,
    isLoggedIn: Boolean(query.data?.user),
    firstTenant,
    dashboardPath: firstTenant ? buildDashboardPath(firstTenant) : null,
    isLoading: query.isLoading
  };
}
