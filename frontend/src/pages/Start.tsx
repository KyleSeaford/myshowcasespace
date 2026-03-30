import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
        : "Sign in to continue onboarding and deploy your showcase site.",
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

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signup(email.trim().toLowerCase(), password);
        navigate("/onboarding");
      } else {
        await login(email.trim().toLowerCase(), password);
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
            myshowcase
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
              Account first. Then quick onboarding steps. Then your showcase is deployed.
            </p>
            <ol className="grid gap-3 text-sm text-muted-foreground">
              <li>1. Create account or log in</li>
              <li>2. Add your profile, site details, and links</li>
              <li>3. Press deploy and go live</li>
            </ol>
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
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
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
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                    />
                  </div>
                )}

                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
