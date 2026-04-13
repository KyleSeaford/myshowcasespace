import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ExternalLink, LockKeyhole, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, getTenant, logout, type TenantDetails } from "@/lib/api";

function normalizeSiteUrl(rawUrl: string, slug: string): string {
  if (rawUrl.trim()) {
    return rawUrl.trim().replace(/\/$/, "");
  }

  if (slug.trim()) {
    return `https://${slug.trim()}.getrivo.net`;
  }

  return "";
}

const paidSupportPlanIds = new Set(["personal", "pro", "studio"]);

const Dashboard = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [tenantError, setTenantError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const tenantId = params.get("tenantId") ?? "";

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let isActive = true;
    setTenantError("");

    getTenant(tenantId)
      .then((result) => {
        if (isActive) {
          setTenant(result);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate("/start", { replace: true });
          return;
        }

        setTenantError(error instanceof ApiError ? error.message : "Unable to load tenant details.");
      });

    return () => {
      isActive = false;
    };
  }, [tenantId, navigate]);

  const siteName = params.get("name") ?? tenant?.name ?? "Your site";
  const slug = params.get("slug") ?? tenant?.slug ?? "";
  const planId = tenant?.planId ?? params.get("plan") ?? "free";
  const planName =
    tenant?.plan?.name ??
    (planId === "studio" ? "Studio" : planId === "personal" || planId === "pro" ? "Personal" : "Starter Free");
  const pieceLimit = tenant?.plan?.pieceLimit;
  const pieceCount = tenant?._count?.pieces;
  const hasPaidSupport = paidSupportPlanIds.has(planId);
  const siteUrl = normalizeSiteUrl(params.get("url") ?? tenant?.publishedUrl ?? "", slug);
  const adminUrl = siteUrl ? `${siteUrl}/admin` : "/admin";
  const settingsHref = tenantId ? `/settings?tenantId=${encodeURIComponent(tenantId)}` : "/settings";
  const paidPlanLabel = planId === "studio" ? "Studio" : "Personal";
  const dashboardHref = tenantId ? `/dashboard?tenantId=${encodeURIComponent(tenantId)}` : "/dashboard";

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/start", { replace: true });
    } catch (error) {
      setLogoutError(error instanceof ApiError ? error.message : "Unable to log out right now.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="h-[100vh] bg-background px-6 py-6 md:px-10">
      <div className="mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_1fr] gap-6 md:gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mt-2">{siteName}</h1>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link to={dashboardHref}>Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={settingsHref}>Settings</Link>
              </Button>
              {hasPaidSupport ? (
                <Button variant="outline" asChild>
                  <Link to="/help-center#support">Get Support Here</Link>
                </Button>
              ) : null}
              <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </Button>
            </div>
            {logoutError ? <p className="text-sm text-destructive">{logoutError}</p> : null}
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto pr-1">
          {tenantError ? <p className="mb-4 text-sm text-destructive">{tenantError}</p> : null}

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-heading text-3xl font-light">Live preview</CardTitle>
                <CardDescription>
                  This is your published site preview. If it does not load in-frame, open it in a new tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {siteUrl ? (
                  <>
                    <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground break-all">
                      {siteUrl}
                    </div>
                    <div className="overflow-hidden rounded-md border border-border bg-background">
                      <iframe title="Live site preview" src={siteUrl} className="h-[420px] w-full" />
                    </div>
                    <Button asChild>
                      <a href={siteUrl} target="_blank" rel="noreferrer">
                        Open live site
                        <ExternalLink />
                      </a>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No live URL found yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-5 content-start">
              <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-foreground">
                    <Rocket className="h-4 w-4" />
                    <CardTitle className="text-xl font-medium">Upgrade your plan</CardTitle>
                  </div>
                  <CardDescription>To unlock paid features, follow these steps:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Current plan: <span className="text-foreground">{planName}</span>
                    {typeof pieceCount === "number" && typeof pieceLimit === "number"
                      ? ` (${pieceCount}/${pieceLimit} pieces)`
                      : null}
                  </p>
                  <p>1. Open the pricing page.</p>
                  <p>2. Choose the {paidPlanLabel} or Studio plan.</p>
                  <p>3. Complete checkout to upgrade this site.</p>
                  <Button variant="outline" asChild>
                    <Link to="/#pricing">
                      Go to pricing
                      <ExternalLink />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-foreground">
                    <LockKeyhole className="h-4 w-4" />
                    <CardTitle className="text-xl font-medium">Add pieces via /admin</CardTitle>
                  </div>
                  <CardDescription>
                    To add your content, go to <code className="text-foreground">/admin</code> and enter the admin password you set during onboarding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Path: <code className="text-foreground">/admin</code></p>
                  <p>Use your onboarding admin password to log in and add pieces.</p>
                  <Button variant="outline" asChild>
                    <a href={adminUrl} target="_blank" rel="noreferrer">
                      Open /admin
                      <ExternalLink />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4" />
                    <CardTitle className="text-xl font-medium">Next actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Open <code className="text-foreground">/admin</code> and add pieces.</p>
                  <p>2. Upgrade when you need more pieces or domain features.</p>
                  <p>3. Share your live URL once content is ready.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
