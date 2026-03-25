import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  completeCheckoutSession,
  createCheckoutSession,
  createTenant,
  getTenant,
  listTenants,
  publishTenant,
  setCustomDomain as setCustomDomainApi,
  updateTenant
} from "../api/client";
import { defaultBrandProfile } from "../brand";
import { useAuth } from "../context/AuthContext";
import type { CheckoutSession, Tenant } from "../types/models";

const STEPS = ["Brand", "Publish & Upgrade"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function parseJsonStringArray(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry)).filter((entry) => entry.trim().length > 0);
    }
  } catch {
    // ignore
  }

  return fallback;
}

function toLineItems(value: string): string[] {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function generateTenantIdSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export function DashboardPage() {
  const { user, signOut, refresh } = useAuth();

  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [latestApiKey, setLatestApiKey] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [tenantIdSuffix] = useState(() => generateTenantIdSuffix());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [tenantIdText, setTenantIdText] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [location, setLocation] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [aboutPhoto, setAboutPhoto] = useState("");
  const [aboutPhotoAlt, setAboutPhotoAlt] = useState("");
  const [aboutParagraphsText, setAboutParagraphsText] = useState("");
  const [workTogetherText, setWorkTogetherText] = useState("");

  const canOpenStep = useMemo(
    () => ({
      0: true,
      1: tenant !== null
    }),
    [tenant]
  );

  const generatedTenantLabel = useMemo(() => {
    if (tenant) {
      return tenantIdText;
    }

    const base = slugify(name) || "artist";
    return `${base}-${tenantIdSuffix}`;
  }, [name, tenant, tenantIdSuffix, tenantIdText]);

  function hydrateBrandForm(nextTenant: Tenant): void {
    const nextTheme = nextTenant.theme ?? {};

    const paragraphFallback = nextTenant.bio
      ? nextTenant.bio
          .split(/\n\n+/)
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [];

    const workTogether = parseJsonStringArray(nextTheme.workTogetherItems, []);
    const aboutParagraphs = parseJsonStringArray(nextTheme.aboutParagraphs, paragraphFallback);

    setName(nextTenant.name || "");
    setEmail(nextTenant.contactEmail || user?.email || "");
    setHeroTitle(nextTheme.heroTitle ?? "");
    setTenantIdText(nextTheme.tenantId ?? `${nextTenant.slug}-${nextTenant.id.slice(0, 8)}`);
    setAdminPassword(nextTheme.adminPassword ?? "");
    setInstagramHandle(nextTheme.instagramHandle ?? "");
    setInstagramUrl(nextTenant.socialLinks.instagram ?? nextTheme.instagramUrl ?? "");
    setLocation(nextTheme.location ?? "");
    setSiteTitle(nextTheme.siteTitle ?? "");
    setSiteDescription(nextTheme.siteDescription ?? "");
    setAboutPhoto(nextTheme.aboutPhoto ?? "");
    setAboutPhotoAlt(nextTheme.aboutPhotoAlt ?? "");
    setAboutParagraphsText(aboutParagraphs.join("\n\n"));
    setWorkTogetherText(workTogether.join("\n"));
  }

  async function loadTenant(tenantValue: string): Promise<void> {
    const response = await getTenant(tenantValue);
    setTenant(response.tenant);
    hydrateBrandForm(response.tenant);
  }

  async function refreshWorkspace(preferredTenantId?: string): Promise<void> {
    setWorkspaceLoading(true);
    setError(null);

    try {
      const tenantResponse = await listTenants();
      setTenants(tenantResponse.tenants);

      if (tenantResponse.tenants.length === 0) {
        setTenant(null);
        setActiveTenantId(null);
        setName("");
        setEmail(user?.email ?? "");
        setHeroTitle("");
        setTenantIdText("");
        setAdminPassword("");
        setInstagramHandle("");
        setInstagramUrl("");
        setLocation("");
        setSiteTitle("");
        setSiteDescription("");
        setAboutPhoto("");
        setAboutPhotoAlt("");
        setAboutParagraphsText("");
        setWorkTogetherText("");
        return;
      }

      const selectedTenant = preferredTenantId ?? activeTenantId ?? tenantResponse.tenants[0].id;
      setActiveTenantId(selectedTenant);
      await loadTenant(selectedTenant);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setWorkspaceLoading(false);
    }
  }

  useEffect(() => {
    void refreshWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAboutPhotoSelect(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);

    try {
      const dataUrl = await fileToDataUrl(file);
      setAboutPhoto(dataUrl);
      setNotice("About photo selected and encoded.");
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      event.target.value = "";
    }
  }

  async function handleBrandSave(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const slug = tenant ? tenant.slug : slugify(name);
    if (!slug) {
      setError("A valid name is required to generate slug");
      return;
    }

    const aboutParagraphs = toLineItems(aboutParagraphsText);
    const workTogetherItems = toLineItems(workTogetherText);

    const payload = {
      name,
      slug,
      bio: aboutParagraphs.join("\n\n"),
      contactEmail: email,
      socialLinks: {
        ...(instagramUrl ? { instagram: instagramUrl } : {}),
        ...(instagramHandle ? { instagramHandle } : {})
      },
      theme: {
        heroTitle,
        tenantId: generatedTenantLabel,
        adminPassword,
        instagramHandle,
        instagramUrl,
        location,
        siteTitle,
        siteDescription,
        aboutPhoto,
        aboutPhotoAlt,
        aboutParagraphs: JSON.stringify(aboutParagraphs),
        workTogetherItems: JSON.stringify(workTogetherItems)
      }
    };

    setActionLoading("brand");

    try {
      if (!tenant) {
        const created = await createTenant(payload);
        setLatestApiKey(created.apiKey);
        await refresh();
        await refreshWorkspace(created.tenant.id);
        setStepIndex(1);
        setNotice("Brand saved. Next step is publish and billing.");
      } else {
        await updateTenant(tenant.id, {
          name: payload.name,
          bio: payload.bio,
          contactEmail: payload.contactEmail,
          socialLinks: payload.socialLinks,
          theme: payload.theme
        });
        await refreshWorkspace(tenant.id);
        setNotice("Brand profile updated.");
      }
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePublishSite(): Promise<void> {
    if (!tenant) {
      return;
    }

    setActionLoading("publish");
    setError(null);

    try {
      await publishTenant(tenant.id);
      await loadTenant(tenant.id);
      setNotice("Site published. Use /admin on your site to add pieces later.");
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartUpgrade(): Promise<void> {
    if (!tenant) {
      return;
    }

    setActionLoading("upgrade-start");
    setError(null);

    try {
      const created = await createCheckoutSession(tenant.id);
      setCheckoutSession(created.checkoutSession);
      window.open(created.checkoutSession.checkoutUrl, "_blank", "noopener,noreferrer");
      setNotice("Checkout session created. Complete payment, then activate below.");
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCompleteUpgrade(): Promise<void> {
    if (!tenant || !checkoutSession) {
      return;
    }

    setActionLoading("upgrade-complete");
    setError(null);

    try {
      await completeCheckoutSession(tenant.id, checkoutSession.id);
      await refreshWorkspace(tenant.id);
      setCheckoutSession(null);
      setNotice("Pro plan activated.");
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCustomDomain(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!tenant) {
      return;
    }

    setActionLoading("custom-domain");
    setError(null);

    try {
      await setCustomDomainApi(tenant.id, customDomain.trim().toLowerCase());
      await loadTenant(tenant.id);
      setCustomDomain("");
      setNotice("Custom domain saved. Verification pending.");
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setActionLoading(null);
    }
  }

  if (workspaceLoading) {
    return <main className="centered-state">Loading workspace...</main>;
  }

  return (
    <main className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Control Room</p>
          <h1>Brand setup and publishing</h1>
          <p className="small-muted">Signed in as {user?.email}</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            void signOut();
          }}
        >
          Logout
        </button>
      </header>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {notice ? <p className="alert alert-success">{notice}</p> : null}

      <section className="tenant-switcher">
        <span>Your tenants</span>
        <div className="chip-group">
          {tenants.length === 0 ? <span className="chip">No tenant yet</span> : null}
          {tenants.map((tenantItem) => (
            <button
              key={tenantItem.id}
              className={`chip ${tenantItem.id === activeTenantId ? "active" : ""}`}
              type="button"
              onClick={() => {
                setActiveTenantId(tenantItem.id);
                setStepIndex(0);
                void loadTenant(tenantItem.id);
              }}
            >
              {tenantItem.name}
            </button>
          ))}
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="steps-card">
          <h2>Flow</h2>
          <ol>
            {STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  className={stepIndex === index ? "step-active" : ""}
                  onClick={() => {
                    if (canOpenStep[index as 0 | 1]) {
                      setStepIndex(index);
                    }
                  }}
                  disabled={!canOpenStep[index as 0 | 1]}
                >
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="panel-card">
          {stepIndex === 0 ? (
            <form className="stack-form" onSubmit={(event) => void handleBrandSave(event)}>
              <h2>{tenant ? "Edit brand profile" : "Create brand profile"}</h2>

              <div className="field-grid">
                <label>
                  Name
                  <input
                    required
                    value={name}
                    placeholder={defaultBrandProfile.name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    placeholder={defaultBrandProfile.email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Hero title
                  <input
                    value={heroTitle}
                    placeholder={defaultBrandProfile.heroTitle}
                    onChange={(event) => setHeroTitle(event.target.value)}
                  />
                </label>
                <label>
                  Tenant ID label (auto-generated)
                  <input value={generatedTenantLabel} placeholder={defaultBrandProfile.tenantId} readOnly />
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Admin password (local fallback)
                  <div className="password-field">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminPassword}
                      placeholder={defaultBrandProfile.adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setShowAdminPassword((value) => !value)}
                      aria-label={showAdminPassword ? "Hide admin password" : "Show admin password"}
                    >
                      {showAdminPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M3.3 4.7 2 6l3.02 3.02C3.2 10.5 2.1 12 2.1 12s3.82 5.9 9.9 5.9c1.72 0 3.23-.4 4.54-1.02L20 20.3 21.3 19 3.3 4.7Zm8.7 11.2c-2.16 0-3.9-1.74-3.9-3.9 0-.56.12-1.1.34-1.58l5.14 5.14c-.48.22-1.02.34-1.58.34Zm0-9.8c2.16 0 3.9 1.74 3.9 3.9 0 .56-.12 1.1-.34 1.58L10.44 6.4c.48-.2 1.02-.3 1.56-.3Zm0 2.2a3.7 3.7 0 0 0-.66.06l4.3 4.3c.04-.22.06-.44.06-.66 0-2.04-1.66-3.7-3.7-3.7Zm0-4.2c6.08 0 9.9 5.9 9.9 5.9s-.82 1.28-2.4 2.64l-1.44-1.44A14.9 14.9 0 0 0 19.3 12c-1.1-1.2-3.5-3.8-7.3-3.8-.98 0-1.87.18-2.67.46L7.76 7.1A11.7 11.7 0 0 1 12 4.1Z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M12 5c6.1 0 9.9 7 9.9 7s-3.8 7-9.9 7S2.1 12 2.1 12 5.9 5 12 5Zm0 11c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0-6.3A2.3 2.3 0 1 1 9.7 12 2.3 2.3 0 0 1 12 9.7Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                <label>
                  Location
                  <input
                    value={location}
                    placeholder={defaultBrandProfile.location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Instagram handle
                  <input
                    value={instagramHandle}
                    placeholder={defaultBrandProfile.instagramHandle}
                    onChange={(event) => setInstagramHandle(event.target.value)}
                  />
                </label>
                <label>
                  Instagram URL
                  <input
                    value={instagramUrl}
                    placeholder={defaultBrandProfile.instagramUrl}
                    onChange={(event) => setInstagramUrl(event.target.value)}
                  />
                </label>
              </div>

              <label>
                Site title
                <input
                  value={siteTitle}
                  placeholder={defaultBrandProfile.siteTitle}
                  onChange={(event) => setSiteTitle(event.target.value)}
                />
              </label>

              <label>
                Site description
                <textarea
                  rows={3}
                  value={siteDescription}
                  placeholder={defaultBrandProfile.siteDescription}
                  onChange={(event) => setSiteDescription(event.target.value)}
                />
              </label>

              <div className="field-grid">
                <label>
                  About photo
                  <input type="file" accept="image/*" onChange={(event) => void handleAboutPhotoSelect(event)} />
                </label>
                <label>
                  About photo alt
                  <input
                    value={aboutPhotoAlt}
                    placeholder={defaultBrandProfile.aboutPhotoAlt}
                    onChange={(event) => setAboutPhotoAlt(event.target.value)}
                  />
                </label>
              </div>

              {aboutPhoto ? (
                <div className="photo-preview-box">
                  <img className="about-photo-preview" src={aboutPhoto} alt={aboutPhotoAlt || "About photo preview"} />
                  <div className="photo-actions">
                    <button className="btn btn-ghost" type="button" onClick={() => setAboutPhoto("")}>
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : null}

              <label>
                About paragraphs (one paragraph per block/newline)
                <textarea
                  rows={6}
                  value={aboutParagraphsText}
                  placeholder={defaultBrandProfile.aboutParagraphs.join("\n\n")}
                  onChange={(event) => setAboutParagraphsText(event.target.value)}
                />
              </label>

              <label>
                Work together items (one per line)
                <textarea
                  rows={3}
                  value={workTogetherText}
                  placeholder={defaultBrandProfile.workTogetherItems.join("\n")}
                  onChange={(event) => setWorkTogetherText(event.target.value)}
                />
              </label>

              {latestApiKey ? <p className="api-key-box">Tenant API key: {latestApiKey}</p> : null}

              <button className="btn btn-primary" disabled={actionLoading === "brand"} type="submit">
                {actionLoading === "brand" ? "Saving..." : tenant ? "Save Brand" : "Create Brand"}
              </button>
            </form>
          ) : null}

          {stepIndex === 1 ? (
            <div className="stack-form">
              <h2>Publish and plan</h2>

              {tenant?.published ? (
                <div className="published-box">
                  <p>Published URL: {tenant.publishedUrl}</p>
                  <p>Admin URL: {tenant.publishedUrl}/admin</p>
                  <p className="small-muted">Add pieces later from your site admin.</p>
                </div>
              ) : (
                <button className="btn btn-primary" type="button" onClick={() => void handlePublishSite()}>
                  {actionLoading === "publish" ? "Publishing..." : "Publish site"}
                </button>
              )}

              {tenant?.planId === "free" ? (
                <div className="upgrade-box">
                  <h3>Upgrade to Pro</h3>
                  <ul>
                    <li>Custom domain support</li>
                    <li>More pieces and expanded customization</li>
                  </ul>
                  <button className="btn btn-primary" type="button" onClick={() => void handleStartUpgrade()}>
                    {actionLoading === "upgrade-start" ? "Creating checkout..." : "Start Pro Checkout"}
                  </button>
                  {checkoutSession ? (
                    <div className="checkout-box">
                      <p>Checkout URL: {checkoutSession.checkoutUrl}</p>
                      <button className="btn btn-secondary" type="button" onClick={() => void handleCompleteUpgrade()}>
                        {actionLoading === "upgrade-complete" ? "Confirming..." : "I paid, activate Pro"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <form className="stack-form" onSubmit={(event) => void handleCustomDomain(event)}>
                  <h3>Pro custom domain</h3>
                  <label>
                    Domain hostname
                    <input
                      required
                      placeholder="portfolio.yourdomain.com"
                      value={customDomain}
                      onChange={(event) => setCustomDomain(event.target.value)}
                    />
                  </label>
                  <button className="btn btn-primary" type="submit" disabled={actionLoading === "custom-domain"}>
                    {actionLoading === "custom-domain" ? "Saving..." : "Save custom domain"}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
