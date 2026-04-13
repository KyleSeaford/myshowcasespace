import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  getMe,
  getTenant,
  logout,
  type TenantDetails,
  type TenantThemeId,
  updateTenant,
  updateTenantTheme,
  uploadImage
} from "@/lib/api";

type SettingsForm = {
  bio: string;
  aboutPhotoUrl: string;
  contactEmail: string;
  heroTitle: string;
  creatorName: string;
  discipline: string;
  location: string;
  waysToWorkTogether: string;
  instagram: string;
  twitter: string;
  pinterest: string;
  newAdminPassword: string;
  confirmAdminPassword: string;
};

const emptyForm: SettingsForm = {
  bio: "",
  aboutPhotoUrl: "",
  contactEmail: "",
  heroTitle: "",
  creatorName: "",
  discipline: "",
  location: "",
  waysToWorkTogether: "",
  instagram: "",
  twitter: "",
  pinterest: "",
  newAdminPassword: "",
  confirmAdminPassword: ""
};

const paidPlanIds = new Set(["personal", "pro", "studio"]);

const themeOptions: Array<{ id: TenantThemeId; label: string; description: string }> = [
  {
    id: "default",
    label: "Default",
    description: "Clean and direct."
  },
  {
    id: "sunny",
    label: "Sunny",
    description: "Warm and bright."
  },
  {
    id: "dark",
    label: "Dark",
    description: "Bold and high contrast."
  }
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

function resolveHeroTitle(heroTitle: string, creatorName: string, siteName: string): string {
  return heroTitle.trim() || creatorName.trim() || siteName.trim();
}

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tenantId = searchParams.get("tenantId")?.trim() ?? "";

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [baseTheme, setBaseTheme] = useState<Record<string, string>>({});
  const [baseSocialLinks, setBaseSocialLinks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [themeChoice, setThemeChoice] = useState<TenantThemeId>("default");
  const [themeError, setThemeError] = useState("");
  const [themeSuccess, setThemeSuccess] = useState("");
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        let resolvedTenantId = tenantId;
        if (!resolvedTenantId) {
          const profile = await getMe();
          if (!profile.tenants.length) {
            navigate("/onboarding", { replace: true });
            return;
          }
          resolvedTenantId = profile.tenants[0].id;
          setSearchParams({ tenantId: resolvedTenantId }, { replace: true });
        }

        const details = await getTenant(resolvedTenantId);
        if (!isActive) {
          return;
        }

        const theme = details.theme ?? {};
        const socialLinks = details.socialLinks ?? {};

        setTenant(details);
        setThemeChoice((details.themeId as TenantThemeId | undefined) ?? "default");
        setThemeError("");
        setThemeSuccess("");
        setBaseTheme(theme);
        setBaseSocialLinks(socialLinks);
        setForm({
          bio: details.bio ?? "",
          aboutPhotoUrl: theme.aboutPhotoUrl ?? "",
          contactEmail: details.contactEmail ?? "",
          heroTitle: theme.heroTitle ?? theme.creatorName ?? details.name ?? "",
          creatorName: theme.creatorName ?? "",
          discipline: theme.discipline ?? "",
          location: theme.location ?? "",
          waysToWorkTogether: theme.workTogether ?? "",
          instagram: socialLinks.instagram ?? "",
          twitter: socialLinks.twitter ?? "",
          pinterest: socialLinks.pinterest ?? "",
          newAdminPassword: "",
          confirmAdminPassword: ""
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate("/start", { replace: true });
          return;
        }

        setErrorMessage(error instanceof ApiError ? error.message : "Unable to load settings.");
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
  }, [tenantId, navigate, setSearchParams]);

  const dashboardPath = useMemo(() => {
    if (!tenant) {
      return tenantId ? `/dashboard?tenantId=${encodeURIComponent(tenantId)}` : "/dashboard";
    }
    return buildDashboardPath(tenant);
  }, [tenant, tenantId]);

  const settingsPath = tenantId ? `/settings?tenantId=${encodeURIComponent(tenantId)}` : "/settings";
  const canChooseTheme = tenant ? paidPlanIds.has(tenant.planId) : false;
  const currentThemeLabel =
    themeOptions.find((option) => option.id === ((tenant?.themeId as TenantThemeId | undefined) ?? "default"))?.label ??
    "Default";

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

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!tenant?.id) {
      setErrorMessage("Missing tenant context.");
      return;
    }

    if (!isValidEmail(form.contactEmail.trim())) {
      setErrorMessage("Please enter a valid contact email.");
      return;
    }

    if (form.newAdminPassword && form.newAdminPassword.length < 4) {
      setErrorMessage("New admin password must be at least 4 characters.");
      return;
    }

    if (form.newAdminPassword && form.newAdminPassword !== form.confirmAdminPassword) {
      setErrorMessage("New admin password and confirmation do not match.");
      return;
    }

    const socialLinks: Record<string, string> = {
      ...baseSocialLinks,
      instagram: form.instagram.trim(),
      twitter: form.twitter.trim(),
      pinterest: form.pinterest.trim()
    };

    for (const [key, value] of Object.entries(socialLinks)) {
      if (!String(value || "").trim()) {
        delete socialLinks[key];
      }
    }

    const theme: Record<string, string> = {
      ...baseTheme,
      heroTitle: resolveHeroTitle(form.heroTitle, form.creatorName, tenant.name),
      creatorName: form.creatorName.trim(),
      discipline: form.discipline.trim(),
      aboutPhotoUrl: form.aboutPhotoUrl.trim(),
      location: form.location.trim(),
      workTogether: form.waysToWorkTogether.trim()
    };

    setIsSaving(true);
    try {
      const updated = await updateTenant(tenant.id, {
        bio: form.bio.trim() || null,
        contactEmail: form.contactEmail.trim(),
        socialLinks,
        theme,
        ...(form.newAdminPassword ? { adminPassword: form.newAdminPassword } : {})
      });

      const updatedTheme = updated.theme ?? {};
      const updatedSocialLinks = updated.socialLinks ?? {};

      setTenant(updated);
      setBaseTheme(updatedTheme);
      setBaseSocialLinks(updatedSocialLinks);
      setForm((current) => ({
        ...current,
        bio: updated.bio ?? "",
        aboutPhotoUrl: updatedTheme.aboutPhotoUrl ?? "",
        contactEmail: updated.contactEmail ?? "",
        heroTitle: updatedTheme.heroTitle ?? updatedTheme.creatorName ?? updated.name ?? "",
        creatorName: updatedTheme.creatorName ?? "",
        discipline: updatedTheme.discipline ?? "",
        location: updatedTheme.location ?? "",
        waysToWorkTogether: updatedTheme.workTogether ?? "",
        instagram: updatedSocialLinks.instagram ?? "",
        twitter: updatedSocialLinks.twitter ?? "",
        pinterest: updatedSocialLinks.pinterest ?? "",
        newAdminPassword: "",
        confirmAdminPassword: ""
      }));

      setSuccessMessage("Settings saved.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeSave = async () => {
    setThemeError("");
    setThemeSuccess("");

    if (!tenant?.id) {
      setThemeError("Missing tenant context.");
      return;
    }

    setIsSavingTheme(true);
    try {
      const updated = await updateTenantTheme(tenant.id, themeChoice);
      setTenant(updated);
      setThemeChoice((updated.themeId as TenantThemeId | undefined) ?? "default");
      setThemeSuccess("Theme set.");
    } catch (error) {
      setThemeError(error instanceof ApiError ? error.message : "Unable to set theme.");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleAboutPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!tenant?.id) {
      setErrorMessage("Missing tenant context.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUploadingPhoto(true);

    try {
      const uploaded = await uploadImage(file, {
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      });
      setForm((current) => ({
        ...current,
        aboutPhotoUrl: uploaded.url
      }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Photo upload failed.");
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  return (
    <main className="h-[100vh] bg-background px-6 py-8 md:px-10">
      <div className="mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_1fr] gap-8 md:gap-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Settings</p>
            <h1 className="font-heading mt-2 text-4xl font-light text-foreground md:text-5xl">
              Edit site details
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={dashboardPath}>Dashboard</Link>
              </Button>
              <Button asChild>
                <Link to={settingsPath}>Settings</Link>
              </Button>
              {canChooseTheme ? (
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
          <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-heading text-3xl font-light">Profile and publishing info</CardTitle>
              <CardDescription>Update what you entered in onboarding. Save applies changes to your tenant record.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading settings...</p>
              ) : (
                <form className="space-y-5" onSubmit={handleSave}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="site-name" className="text-sm text-foreground">Site name</label>
                    <Input
                      id="site-name"
                      value={tenant?.name ?? ""}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="site-slug" className="text-sm text-foreground">Site slug</label>
                    <Input id="site-slug" value={tenant?.slug ?? ""} readOnly />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Site name and slug are locked after setup. Contact support if either needs to change.
                </p>

                <section className="space-y-4 border-y border-border py-5">
                  <div className="space-y-1">
                    <h2 className="font-heading text-2xl font-light text-foreground">Theme</h2>
                    {tenant?.themeLocked ? (
                      <p className="text-sm text-muted-foreground">
                        Theme: <span className="text-foreground">{currentThemeLabel}</span>. Your theme has been set.
                      </p>
                    ) : canChooseTheme ? (
                      <p className="text-sm text-muted-foreground">
                        Choose your theme. This can only be set once.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Theme: <span className="text-foreground">Default</span>. Upgrade to choose a theme.
                      </p>
                    )}
                  </div>

                  {canChooseTheme && !tenant?.themeLocked ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        {themeOptions.map((option) => {
                          const isSelected = themeChoice === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setThemeChoice(option.id)}
                              className={`rounded-md border p-4 text-left transition-colors ${
                                isSelected ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground"
                              }`}
                              aria-pressed={isSelected}
                            >
                              <span className="block text-sm font-medium text-foreground">{option.label}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                            </button>
                          );
                        })}
                      </div>
                      {themeError ? <p className="text-sm text-destructive">{themeError}</p> : null}
                      {themeSuccess ? <p className="text-sm text-emerald-600">{themeSuccess}</p> : null}
                      <div className="flex items-center justify-end">
                        <Button type="button" onClick={handleThemeSave} disabled={isSavingTheme}>
                          {isSavingTheme ? "Saving theme..." : "Save theme"}
                        </Button>
                      </div>
                    </>
                  ) : null}

                  {!canChooseTheme ? (
                    <Button variant="outline" type="button" asChild>
                      <Link to="/#pricing">Go to pricing</Link>
                    </Button>
                  ) : null}
                </section>

                <div className="space-y-2">
                  <label htmlFor="hero-title" className="text-sm text-foreground">Hero title</label>
                  <Input
                    id="hero-title"
                    value={form.heroTitle}
                    onChange={(event) => setForm((current) => ({ ...current, heroTitle: event.target.value }))}
                    placeholder="Selected works by Bob Smith"
                  />
                  <p className="text-xs text-muted-foreground">
                    Main headline shown at the top of your site.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm text-foreground">Bio</label>
                    <textarea
                      id="bio"
                      value={form.bio}
                      onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                      className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Short bio shown on your site."
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="creator-name" className="text-sm text-foreground">Creator name</label>
                    <Input
                      id="creator-name"
                      value={form.creatorName}
                      onChange={(event) => setForm((current) => ({ ...current, creatorName: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="about-photo" className="text-sm text-foreground">About photo</label>
                  <input
                    id="about-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAboutPhotoUpload}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-sm file:text-foreground hover:file:bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a portrait/studio photo shown on your About page.
                  </p>
                  {form.aboutPhotoUrl ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-md border border-border bg-secondary/30 p-2">
                        <img
                          src={form.aboutPhotoUrl}
                          alt="About preview"
                          className="h-40 w-full rounded object-cover md:w-72"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            aboutPhotoUrl: ""
                          }))
                        }
                      >
                        Remove photo
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-sm text-foreground">Contact email</label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.contactEmail}
                      onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm text-foreground">Location (optional)</label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="discipline" className="text-sm text-foreground">Discipline</label>
                  <Input
                    id="discipline"
                    value={form.discipline}
                    onChange={(event) => setForm((current) => ({ ...current, discipline: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="work-together" className="text-sm text-foreground">Ways to work together (optional)</label>
                  <textarea
                    id="work-together"
                    value={form.waysToWorkTogether}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, waysToWorkTogether: event.target.value }))
                    }
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={"Commissions - Custom artwork\nBrand collaborations - Campaign visuals"}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="instagram" className="text-sm text-foreground">Instagram</label>
                    <Input
                      id="instagram"
                      value={form.instagram}
                      onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="twitter" className="text-sm text-foreground">Twitter/X</label>
                    <Input
                      id="twitter"
                      value={form.twitter}
                      onChange={(event) => setForm((current) => ({ ...current, twitter: event.target.value }))}
                      placeholder="https://x.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="pinterest" className="text-sm text-foreground">Pinterest</label>
                    <Input
                      id="pinterest"
                      value={form.pinterest}
                      onChange={(event) => setForm((current) => ({ ...current, pinterest: event.target.value }))}
                      placeholder="https://pinterest.com/username"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="new-admin-password" className="text-sm text-foreground">New admin password (optional)</label>
                    <PasswordInput
                      id="new-admin-password"
                      value={form.newAdminPassword}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, newAdminPassword: event.target.value }))
                      }
                      minLength={4}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-admin-password" className="text-sm text-foreground">Confirm new admin password</label>
                    <PasswordInput
                      id="confirm-admin-password"
                      value={form.confirmAdminPassword}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, confirmAdminPassword: event.target.value }))
                      }
                      minLength={4}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

                  <div className="flex items-center justify-end">
                    <Button type="submit" disabled={isSaving || isUploadingPhoto}>
                      {isSaving ? "Saving..." : isUploadingPhoto ? "Uploading photo..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Settings;
