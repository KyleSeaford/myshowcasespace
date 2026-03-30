import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, LockKeyhole, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function normalizeSiteUrl(rawUrl: string, slug: string): string {
  if (rawUrl.trim()) {
    return rawUrl.trim().replace(/\/$/, "");
  }

  if (slug.trim()) {
    return `https://${slug.trim()}.myshowcase.space`;
  }

  return "";
}

const Dashboard = () => {
  const [params] = useSearchParams();
  const siteName = params.get("name") ?? "Your site";
  const slug = params.get("slug") ?? "";
  const tenantId = params.get("tenantId") ?? "";
  const planId = params.get("plan") ?? "free";
  const siteUrl = normalizeSiteUrl(params.get("url") ?? "", slug);
  const adminUrl = siteUrl ? `${siteUrl}/admin` : "/admin";

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:gap-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mt-2">{siteName}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Plan: {planId}</span>
            {tenantId ? (
              <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">ID: {tenantId}</span>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
                    <iframe
                      title="Live site preview"
                      src={siteUrl}
                      className="h-[450px] w-full"
                    />
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

          <div className="grid gap-6 content-start">
            <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-foreground">
                  <Rocket className="h-4 w-4" />
                  <CardTitle className="text-xl font-medium">Upgrade to Pro</CardTitle>
                </div>
                <CardDescription>To unlock pro features, follow these steps:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Open the pricing page.</p>
                <p>2. Choose the Portfolio/Pro plan.</p>
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
                <p>2. Upgrade plan when you need pro features.</p>
                <p>3. Share your live URL once content is ready.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;