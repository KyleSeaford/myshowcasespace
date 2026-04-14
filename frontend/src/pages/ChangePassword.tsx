import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, changePassword, getMe, type TenantSummary } from "@/lib/api";

function dashboardPath(tenant: TenantSummary): string {
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

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    void getMe()
      .then(() => {
        if (active) {
          setIsCheckingSession(false);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate("/start", { replace: true });
          return;
        }

        setErrorMessage("Unable to verify your session. Please try again.");
        setIsCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      const profile = await getMe();
      if (profile.tenants.length > 0) {
        navigate(dashboardPath(profile.tenants[0]), { replace: true });
        return;
      }

      navigate("/onboarding", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-foreground">
            Rivo
          </Link>
          <Link to="/start" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Back to Start
          </Link>
        </header>

        <section className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Studio invite</p>
            <h1 className="font-heading text-5xl leading-[1.08] text-foreground md:text-6xl">
              Set your own password.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Temporary invite passwords are only for first login. Choose a permanent password before editing the Studio.
            </p>
          </div>

          <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-4 w-4 text-foreground" />
                <CardTitle className="font-heading text-3xl font-light">Change password</CardTitle>
              </div>
              <CardDescription>Enter the temporary password from your invite email, then choose a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingSession ? (
                <p className="text-sm text-muted-foreground">Checking session...</p>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="current-password" className="text-sm text-foreground">
                      Temporary password
                    </label>
                    <PasswordInput
                      id="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm text-foreground">
                      New password
                    </label>
                    <PasswordInput
                      id="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm text-foreground">
                      Confirm new password
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>

                  {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save password"}
                    <ArrowRight />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default ChangePassword;
