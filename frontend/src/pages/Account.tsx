import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  cancelTenantBilling,
  getTenant,
  changeEmail,
  createBillingPortalSession,
  deleteAccount,
  getMe,
  logout,
  syncTenantBilling,
  type AuthUser,
  type TenantDetails,
  type TenantSummary
} from "@/lib/api";

function planLabel(planId: string): string {
  if (planId === "studio") {
    return "Studio";
  }

  if (planId === "personal" || planId === "pro") {
    return "Personal";
  }

  return "Starter Free";
}

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailForm, setEmailForm] = useState({ email: "", currentPassword: "" });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "", confirmation: "" });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const tenantId = searchParams.get("tenantId")?.trim() ?? "";


  function buildDashboardPath(tenant: TenantDetails): string {
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

  const [tenant, setTenant] = useState<TenantDetails | null>(null);


  const dashboardPath = useMemo(() => {
    if (!tenant) {
      return tenantId ? `/dashboard?tenantId=${encodeURIComponent(tenantId)}` : "/dashboard";
    }
    return buildDashboardPath(tenant);
  }, [tenant, tenantId]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const profile = await getMe();
        if (!isActive) {
          return;
        }

        setUser(profile.user);
        setTenants(profile.tenants);
        setEmailForm((current) => ({ ...current, email: profile.user.email }));

        let resolvedTenantId = tenantId;
        if (!resolvedTenantId && profile.tenants.length) {
          resolvedTenantId = profile.tenants[0].id;
          setSearchParams({ tenantId: resolvedTenantId }, { replace: true });
        }

        if (resolvedTenantId) {
          const details = await getTenant(resolvedTenantId);
          if (!isActive) {
            return;
          }
          setTenant(details);
        } else {
          setTenant(null);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate("/start", { replace: true });
          return;
        }

        setErrorMessage(error instanceof ApiError ? error.message : "Unable to load account settings.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [navigate, tenantId, setSearchParams]);

  const ownedTenants = useMemo(() => tenants.filter((tenant) => tenant.userRole !== "MEMBER"), [tenants]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setBusyAction("email");

    try {
      const updated = await changeEmail(emailForm.email, emailForm.currentPassword);
      setUser(updated);
      setEmailForm({ email: updated.email, currentPassword: "" });
      setMessage("Email updated.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to update email.");
    } finally {
      setBusyAction("");
    }
  };

  const handlePortal = async (tenantId: string) => {
    setMessage("");
    setErrorMessage("");
    setBusyAction(`portal:${tenantId}`);

    try {
      const url = await createBillingPortalSession(tenantId, window.location.href);
      window.location.href = url;
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to open billing portal.");
      setBusyAction("");
    }
  };

  const handleCancel = async (tenantId: string) => {
    const confirmed = window.confirm("Cancel this paid plan now? This moves the site back to Starter Free.");
    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");
    setBusyAction(`cancel:${tenantId}`);

    try {
      const updatedTenant = await cancelTenantBilling(tenantId);
      if (updatedTenant) {
        setTenants((current) =>
          current.map((tenant) =>
            tenant.id === updatedTenant.id
              ? {
                  ...tenant,
                  planId: updatedTenant.planId,
                  themeId: updatedTenant.themeId,
                  themeLocked: updatedTenant.themeLocked,
                  publishedUrl: updatedTenant.publishedUrl
                }
              : tenant
          )
        );
      }
      setMessage("Plan cancelled. The site is now on Starter Free.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to cancel this plan.");
    } finally {
      setBusyAction("");
    }
  };

  const handleSyncBilling = async (tenantId: string) => {
    setMessage("");
    setErrorMessage("");
    setBusyAction(`sync:${tenantId}`);

    try {
      const result = await syncTenantBilling(tenantId);
      if (result.tenant) {
        setTenants((current) =>
          current.map((tenant) =>
            tenant.id === result.tenant?.id
              ? {
                  ...tenant,
                  planId: result.tenant.planId,
                  themeId: result.tenant.themeId,
                  themeLocked: result.tenant.themeLocked,
                  publishedUrl: result.tenant.publishedUrl
                }
              : tenant
          )
        );
        setTenant(result.tenant);
      }
      setMessage(result.synced ? "Billing refreshed." : "No completed Stripe checkout was found to sync.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to refresh billing.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (deleteForm.confirmation !== "DELETE") {
      setErrorMessage("Type DELETE to confirm account deletion.");
      return;
    }

    setBusyAction("delete");
    try {
      await deleteAccount(deleteForm.currentPassword);
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to delete account.");
      setBusyAction("");
    }
  };

  const handleLogout = async () => {
    setBusyAction("logout");
    try {
      await logout();
      navigate("/start", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to log out.");
      setBusyAction("");
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Account</p>
            <h1 className="font-heading mt-2 text-4xl font-light text-foreground md:text-5xl">User settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Manage login details, payment settings, and account deletion.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
                <Link to={dashboardPath}>Dashboard</Link>
            </Button>
            <Button variant="ghost" onClick={handleLogout} disabled={busyAction === "logout"}>
              {busyAction === "logout" ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </header>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading account...</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-heading text-3xl font-light">Email</CardTitle>
            <CardDescription>Use this email for login, account notices, and Stripe customer records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleEmailSubmit}>
              <div className="space-y-2">
                <label htmlFor="account-email" className="text-sm text-foreground">
                  Email
                </label>
                <Input
                  id="account-email"
                  type="email"
                  value={emailForm.email}
                  onChange={(event) => setEmailForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email-password" className="text-sm text-foreground">
                  Current password
                </label>
                <PasswordInput
                  id="email-password"
                  value={emailForm.currentPassword}
                  onChange={(event) =>
                    setEmailForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  minLength={8}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={busyAction === "email"}>
                {busyAction === "email" ? "Saving..." : "Change email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-heading text-3xl font-light">Plans and payment</CardTitle>
            <CardDescription>Starter Free remains available. Paid plans can be changed or cancelled here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownedTenants.length ? (
              ownedTenants.map((tenant) => {
                const isPaid = tenant.planId === "personal" || tenant.planId === "pro" || tenant.planId === "studio";
                const portalBusy = busyAction === `portal:${tenant.id}`;
                const cancelBusy = busyAction === `cancel:${tenant.id}`;
                const syncBusy = busyAction === `sync:${tenant.id}`;

                return (
                  <div
                    key={tenant.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">Current plan: {planLabel(tenant.planId)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/pricing?tenantId=${encodeURIComponent(tenant.id)}`}>
                          {isPaid ? "Change plan" : "Upgrade"}
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => void handleSyncBilling(tenant.id)} disabled={syncBusy}>
                        {syncBusy ? "Refreshing..." : "Refresh billing"}
                      </Button>
                      {isPaid ? (
                        <>
                          <Button variant="outline" onClick={() => void handlePortal(tenant.id)} disabled={portalBusy}>
                            {portalBusy ? "Opening..." : "Change payment details"}
                          </Button>
                          <Button variant="destructive" onClick={() => void handleCancel(tenant.id)} disabled={cancelBusy}>
                            {cancelBusy ? "Cancelling..." : "Cancel payment"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Create a site to manage plan and payment settings.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive/40 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-heading text-3xl font-light">Delete account</CardTitle>
            <CardDescription>
              This deletes your login, owned sites, uploaded site records, team memberships, and local billing records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleDeleteSubmit}>
              <div className="space-y-2">
                <label htmlFor="delete-password" className="text-sm text-foreground">
                  Current password
                </label>
                <PasswordInput
                  id="delete-password"
                  value={deleteForm.currentPassword}
                  onChange={(event) =>
                    setDeleteForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  minLength={8}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="delete-confirmation" className="text-sm text-foreground">
                  Type DELETE
                </label>
                <Input
                  id="delete-confirmation"
                  value={deleteForm.confirmation}
                  onChange={(event) =>
                    setDeleteForm((current) => ({ ...current, confirmation: event.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" variant="destructive" disabled={busyAction === "delete"}>
                {busyAction === "delete" ? "Deleting..." : "Delete account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Signed in as <span className="text-foreground">{user?.email ?? "Unknown"}</span>.
        </p>
      </div>
    </main>
  );
};

export default Account;
