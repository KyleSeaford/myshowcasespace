import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, signup } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface AuthPageProps {
  mode: "login" | "signup";
}

export function AuthPage({ mode }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const targetPath = useMemo(() => {
    const fromState = location.state as { from?: string } | null;
    return fromState?.from ?? "/app";
  }, [location.state]);

  const heading = mode === "signup" ? "Create your account" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Start with a free site and publish in minutes."
      : "Sign in to continue managing your showcase.";

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "signup") {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      await refresh();
      navigate(targetPath, { replace: true });
    } catch (caught) {
      if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("Unable to authenticate right now");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">MyShowcase Space</p>
        <h1>{heading}</h1>
        <p>{subtitle}</p>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@studio.com"
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account?" : "Need an account?"} {" "}
          <Link to={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Log in" : "Sign up"}</Link>
        </p>
      </section>
    </main>
  );
}
