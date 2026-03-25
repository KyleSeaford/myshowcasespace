import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, getMe, logout } from "../api/client";
import type { AuthMeResponse, User } from "../types/models";

interface AuthContextValue {
  user: User | null;
  tenantSummaries: AuthMeResponse["tenants"];
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantSummaries, setTenantSummaries] = useState<AuthMeResponse["tenants"]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMe();
      setUser(response.user);
      setTenantSummaries(response.tenants);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setTenantSummaries([]);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
    setTenantSummaries([]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      tenantSummaries,
      loading,
      refresh,
      signOut
    }),
    [loading, refresh, signOut, tenantSummaries, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
