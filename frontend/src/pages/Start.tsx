import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, ScrollText, Sparkles } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, getMe, login, signup } from "@/lib/api";

type AuthMode = "signup" | "login";

const Start = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "signup" ? "Create your account" : "Welcome back"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "signup"
        ? "Start with your account, then complete the guided onboarding flow."
        : "Sign in to continue onboarding and deploy your Rivo site.",
    [mode]
  );

  const submitLabel = mode === "signup" ? "Create account" : "Log in";

  const navigateToDashboard = (tenant: {
    id: string;
    name: string;
    slug: string;
    planId: string;
    publishedUrl: string | null;
  }) => {
    const query = new URLSearchParams({
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.planId
    });

    if (tenant.publishedUrl) {
      query.set("url", tenant.publishedUrl);
    }

    navigate(`/dashboard?${query.toString()}`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!hasAcceptedLegal) {
      setErrorMessage("Please accept the Terms of Service, Privacy Policy, and Cookie Notice.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signup(email.trim().toLowerCase(), password, true);
        navigate("/onboarding");
      } else {
        const user = await login(email.trim().toLowerCase(), password, true);
        if (user.passwordChangeRequired) {
          navigate("/change-password");
          return;
        }
        const profile = await getMe();
        if (profile.tenants.length > 0) {
          navigateToDashboard(profile.tenants[0]);
        } else {
          navigate("/onboarding");
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to continue. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:gap-14">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-foreground">
            Rivo
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back home
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-start">
          <div className="space-y-6 pt-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Start</p>
            <h1 className="font-heading text-5xl md:text-6xl leading-[1.08] text-foreground">Build and launch your site in one flow.</h1>
            <p className="max-w-lg text-muted-foreground text-base md:text-lg leading-relaxed">
              Account first. Then quick onboarding steps. Then your Rivo site is deployed.
            </p>

            <div className="grid gap-3">
              <div className="border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">How It Works</p>
                <ol className="mt-3 grid gap-3 text-sm text-muted-foreground">
                  <li>1. Create your account or log back in</li>
                  <li>2. Add your profile, links, and site details</li>
                  <li>3. Save, open your dashboard, and go live</li>
                </ol>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-border bg-secondary/20 p-4">
                  <ScrollText className="h-4 w-4 text-foreground" />
                  <p className="mt-3 text-sm text-foreground">Clear legal step</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Terms, privacy, and cookies are linked before account access.
                  </p>
                </div>

                <div className="border border-border bg-secondary/20 p-4">
                  <LockKeyhole className="h-4 w-4 text-foreground" />
                  <p className="mt-3 text-sm text-foreground">Private dashboard</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Your account keeps dashboard access separate from the public site.
                  </p>
                </div>

                <div className="border border-border bg-secondary/20 p-4">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  <p className="mt-3 text-sm text-foreground">Fast setup</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    One guided flow takes you from account to live site.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-heading text-3xl font-light">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="hello@tryrivo.org"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-foreground">
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="At least 8 characters"
                  />
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm text-foreground">
                      Confirm password
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                    />
                  </div>
                )}

                <div className="rounded-md border border-border bg-secondary/30 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="legal-acceptance"
                      checked={hasAcceptedLegal}
                      onCheckedChange={(checked) => setHasAcceptedLegal(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">Legal agreement</p>
                      <label htmlFor="legal-acceptance" className="text-xs leading-relaxed text-muted-foreground">
                        {mode === "signup" ? "I agree to the " : "I have read the "}
                        <Link to="/legal/terms-of-service" className="text-foreground underline underline-offset-4">
                          Terms
                        </Link>
                        ,{" "}
                        <Link to="/legal/privacy-policy" className="text-foreground underline underline-offset-4">
                          Privacy
                        </Link>
                        {" and "}
                        <Link to="/legal/cookie-notice" className="text-foreground underline underline-offset-4">
                          Cookies
                        </Link>
                        .
                      </label>
                    </div>
                  </div>
                </div>

                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

                <Button type="submit" className="w-full" disabled={isSubmitting || !hasAcceptedLegal}>
                  {isSubmitting ? "Please wait..." : submitLabel}
                  <ArrowRight />
                </Button>

                <div className="pt-1 text-sm text-muted-foreground">
                  {mode === "signup" ? "Already have an account?" : "Need a new account?"}{" "}
                  <button
                    type="button"
                    className="text-foreground underline underline-offset-4"
                    onClick={() => {
                      setMode(mode === "signup" ? "login" : "signup");
                      setHasAcceptedLegal(false);
                      setErrorMessage("");
                    }}
                  >
                    {mode === "signup" ? "Log in" : "Create account"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Start;
