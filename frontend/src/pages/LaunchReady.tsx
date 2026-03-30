import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LaunchReady = () => {
  const [params] = useSearchParams();
  const siteName = params.get("name") ?? "Your site";
  const siteUrl = params.get("url") ?? "";
  const isPublished = params.get("published") === "1";

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10 flex items-center">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {isPublished ? "Deployment complete" : "Saved to database"}
            </p>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 text-primary" />
              <div className="space-y-2">
                <CardTitle className="font-heading text-4xl font-light leading-tight">
                  {isPublished ? `${siteName} is now live.` : `${siteName} has been saved.`}
                </CardTitle>
                <CardDescription>
                  {isPublished
                    ? "Your onboarding flow is complete and the site is published."
                    : "Your onboarding flow is complete and the site data is in the database."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {siteUrl ? (
              <div className="rounded-md border border-border bg-secondary/40 p-4">
                <p className="text-sm text-muted-foreground mb-1">Live URL</p>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4 break-all"
                >
                  {siteUrl}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Publish was skipped or failed, but your site record was still created successfully.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {siteUrl && (
                <Button asChild>
                  <a href={siteUrl} target="_blank" rel="noreferrer">
                    Open live site
                    <ExternalLink />
                  </a>
                </Button>
              )}

              <Button variant="outline" asChild>
                <Link to="/onboarding">
                  Create another site
                  <RotateCcw />
                </Link>
              </Button>

              <Button variant="ghost" asChild>
                <Link to="/">Return home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default LaunchReady;
