import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, createTenant, getMe, uploadImage } from "@/lib/api";

const slugPattern = /^[a-z0-9-]{3,40}$/;
const totalSteps = 5;

type OnboardingForm = {
  name: string;
  bio: string;
  creatorName: string;
  discipline: string;
  aboutPhotoUrl: string;
  contactEmail: string;
  location: string;
  waysToWorkTogether: string;
  instagram: string;
  twitter: string;
  pinterest: string;
  adminPassword: string;
  confirmAdminPassword: string;
};

function normalizeSlugBase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveTenantSlug(name: string): string {
  const base = normalizeSlugBase(name).slice(0, 40);
  if (!base) {
    return "showcase-site";
  }

  if (base.length >= 3) {
    return base;
  }

  return `${base}-site`.slice(0, 40).replace(/^-|-$/g, "");
}

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

function normalizeSocialUrl(value: string, baseUrl: string): string {
  const trimmed = value.trim();
  const baseWithSlash = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const baseWithoutSlash = baseWithSlash.replace(/\/$/, "");

  if (!trimmed || trimmed === baseWithSlash || trimmed === baseWithoutSlash) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalizedHandle = trimmed.replace(/^@+/, "").replace(/^\/+/, "");
  if (!normalizedHandle) {
    return "";
  }

  return `${baseWithSlash}${normalizedHandle}`;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [form, setForm] = useState<OnboardingForm>({
    name: "",
    bio: "",
    creatorName: "",
    discipline: "",
    aboutPhotoUrl: "",
    contactEmail: "",
    location: "",
    waysToWorkTogether: "",
    instagram: "https://www.instagram.com/",
    twitter: "https://x.com/",
    pinterest: "https://www.pinterest.com/",
    adminPassword: "",
    confirmAdminPassword: ""
  });
  const generatedSlug = useMemo(() => deriveTenantSlug(form.name), [form.name]);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const profile = await getMe();
        if (!active) {
          return;
        }

        setForm((previous) => ({
          ...previous,
          contactEmail: previous.contactEmail || profile.user.email
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate("/start");
          return;
        }

        setErrorMessage("Unable to verify your account. Please try again.");
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    void checkAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 0:
        return "Site basics";
      case 1:
        return "Profile details";
      case 2:
        return "Contact and social";
      case 3:
        return "Admin access";
      default:
        return "Review and save";
    }
  }, [currentStep]);

  const stepDescription = useMemo(() => {
    switch (currentStep) {
      case 0:
        return "Set the public site name and URL slug.";
      case 1:
        return "Add details visitors will see on your site.";
      case 2:
        return "Add your contact info and optional links.";
      case 3:
        return "Set your admin password for site-level access.";
      default:
        return "Confirm everything, then save your site.";
    }
  }, [currentStep]);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const validateStep = (step: number): string | null => {
    if (step === 0) {
      if (form.name.trim().length < 2) {
        return "Your name must be at least 2 characters.";
      }
      if (!slugPattern.test(generatedSlug)) {
        return "Unable to generate a valid slug from your name.";
      }
    }

    if (step === 1) {
      if (form.creatorName.trim().length < 2) {
        return "Creator name must be at least 2 characters.";
      }
      if (form.bio.trim().length < 20) {
        return "Bio should be at least 20 characters.";
      }
      if (!form.aboutPhotoUrl.trim()) {
        return "Please upload an About photo.";
      }
    }

    if (step === 2 && !isValidEmail(form.contactEmail.trim())) {
      return "Please enter a valid contact email.";
    }

    if (step === 2 && form.location.trim().length < 2) {
      return "Please enter your location.";
    }

    if (step === 2 && form.waysToWorkTogether.trim().length < 8) {
      return "Please add at least one way to work together.";
    }

    if (step === 3) {
      if (form.adminPassword.length < 4) {
        return "Admin password must be at least 4 characters.";
      }
      if (form.adminPassword !== form.confirmAdminPassword) {
        return "Admin passwords do not match.";
      }
    }

    return null;
  };

  const deploySite = async () => {
    setIsDeploying(true);
    setErrorMessage("");

    try {
      const socialLinks: Record<string, string> = {};
      const instagramUrl = normalizeSocialUrl(form.instagram, "https://www.instagram.com/");
      const twitterUrl = normalizeSocialUrl(form.twitter, "https://x.com/");
      const pinterestUrl = normalizeSocialUrl(form.pinterest, "https://www.pinterest.com/");

      if (instagramUrl) socialLinks.instagram = instagramUrl;
      if (twitterUrl) socialLinks.twitter = twitterUrl;
      if (pinterestUrl) socialLinks.pinterest = pinterestUrl;

      const tenantResult = await createTenant({
        name: form.name.trim(),
        slug: generatedSlug,
        bio: form.bio.trim(),
        contactEmail: form.contactEmail.trim(),
        adminPassword: form.adminPassword,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        theme: {
          creatorName: form.creatorName.trim(),
          discipline: form.discipline.trim(),
          aboutPhotoUrl: form.aboutPhotoUrl.trim(),
          location: form.location.trim(),
          workTogether: form.waysToWorkTogether.trim()
        }
      });

      const query = new URLSearchParams({
        tenantId: tenantResult.tenant.id,
        name: tenantResult.tenant.name,
        slug: tenantResult.tenant.slug,
        plan: tenantResult.tenant.planId
      });

      if (tenantResult.tenant.publishedUrl) {
        query.set("url", tenantResult.tenant.publishedUrl);
      }

      navigate(`/dashboard?${query.toString()}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Save failed. Please try again.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAboutPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage("");
    setIsUploadingPhoto(true);

    try {
      const uploaded = await uploadImage(file, { tenantSlug: generatedSlug });
      setForm((previous) => ({
        ...previous,
        aboutPhotoUrl: uploaded.url
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Photo upload failed. Please try again.");
      }
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleNext = async () => {
    const validation = validateStep(currentStep);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setErrorMessage("");

    if (currentStep < totalSteps - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    await deploySite();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleNext();
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-background px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl text-sm text-muted-foreground">Checking session...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:gap-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-foreground">
            myshowcase
          </Link>
          <p className="text-sm text-muted-foreground">Step {currentStep + 1} of {totalSteps}</p>
        </header>

        <div className="h-1 w-full bg-muted/60">
          <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <section className="grid items-start gap-8 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Onboarding</p>
            <h1 className="font-heading text-5xl md:text-6xl leading-[1.08] text-foreground">Boom. Boom. Boom. Then live.</h1>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Move through each screen with Next. Your final step saves your setup and opens your dashboard.
            </p>
          </div>

          <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-heading text-3xl font-light">{stepTitle}</CardTitle>
              <CardDescription>{stepDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {currentStep === 0 && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="site-name" className="text-sm text-foreground">Site name</label>
                      <Input
                        id="site-name"
                        value={form.name}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="Alex Rivera"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="slug" className="text-sm text-foreground">Site slug</label>
                      <Input
                        id="slug"
                        value={generatedSlug}
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        Generated from your name. Will publish as `https://{generatedSlug}.myshowcase.space`.
                      </p>
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="creator-name" className="text-sm text-foreground">Creator name</label>
                      <Input
                        id="creator-name"
                        value={form.creatorName}
                        onChange={(event) => setForm((previous) => ({ ...previous, creatorName: event.target.value }))}
                        placeholder="Alex Rivera"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="discipline" className="text-sm text-foreground">Discipline</label>
                      <Input
                        id="discipline"
                        value={form.discipline}
                        onChange={(event) => setForm((previous) => ({ ...previous, discipline: event.target.value }))}
                        placeholder="Photographer / Designer / Artist"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bio" className="text-sm text-foreground">Bio</label>
                      <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(event) => setForm((previous) => ({ ...previous, bio: event.target.value }))}
                        className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Tell visitors what you build and what style your work represents."
                        required
                      />
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
                      <p className="text-xs text-muted-foreground">Upload a portrait or studio image for your About page.</p>
                      {form.aboutPhotoUrl ? (
                        <div className="space-y-3">
                          <div className="overflow-hidden rounded-md border border-border bg-secondary/30 p-2">
                            <img
                              src={form.aboutPhotoUrl}
                              alt="About preview"
                              className="h-36 w-full rounded object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setForm((previous) => ({
                                ...previous,
                                aboutPhotoUrl: ""
                              }))
                            }
                          >
                            Remove photo
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="contact-email" className="text-sm text-foreground">Contact email</label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={form.contactEmail}
                        onChange={(event) => setForm((previous) => ({ ...previous, contactEmail: event.target.value }))}
                        placeholder="studio@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="instagram" className="text-sm text-foreground">Instagram (optional)</label>
                      <Input
                        id="instagram"
                        value={form.instagram}
                        onChange={(event) => setForm((previous) => ({ ...previous, instagram: event.target.value }))}
                        placeholder="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm text-foreground">Location</label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
                        placeholder="London, UK"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="work-together" className="text-sm text-foreground">Ways to work together</label>
                      <textarea
                        id="work-together"
                        value={form.waysToWorkTogether}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, waysToWorkTogether: event.target.value }))
                        }
                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder={"Commissions - Custom artwork for personal collections\nBrand collaborations - Campaign visuals and creative direction"}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="twitter" className="text-sm text-foreground">Twitter/X (optional)</label>
                      <Input
                        id="twitter"
                        value={form.twitter}
                        onChange={(event) => setForm((previous) => ({ ...previous, twitter: event.target.value }))}
                        placeholder="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pinterest" className="text-sm text-foreground">Pinterest (optional)</label>
                      <Input
                        id="pinterest"
                        value={form.pinterest}
                        onChange={(event) => setForm((previous) => ({ ...previous, pinterest: event.target.value }))}
                        placeholder="username"
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div className="rounded-md border border-border bg-secondary/40 p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">Design settings are applied automatically.</p>
                          <p className="text-xs text-muted-foreground">
                            Layout and color are tuned by default so everyone gets a clean launch experience.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="admin-password" className="text-sm text-foreground">Admin password</label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={form.adminPassword}
                        onChange={(event) => setForm((previous) => ({ ...previous, adminPassword: event.target.value }))}
                        minLength={4}
                        required
                        placeholder="Used for site-level admin access"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirm-admin-password" className="text-sm text-foreground">Confirm admin password</label>
                      <Input
                        id="confirm-admin-password"
                        type="password"
                        value={form.confirmAdminPassword}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, confirmAdminPassword: event.target.value }))
                        }
                        minLength={4}
                        required
                      />
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4 rounded-md border border-border bg-secondary/40 p-4 text-sm">
                    <p className="font-medium text-foreground">Ready to save:</p>
                    <div className="grid gap-2 text-muted-foreground">
                      <p><span className="text-foreground">Site:</span> {form.name}</p>
                      <p><span className="text-foreground">URL:</span> https://{generatedSlug}.myshowcase.space</p>
                      <p><span className="text-foreground">Creator:</span> {form.creatorName}</p>
                      <p><span className="text-foreground">Contact:</span> {form.contactEmail}</p>
                      <p><span className="text-foreground">About photo:</span> {form.aboutPhotoUrl ? "Uploaded" : "Missing"}</p>
                      <p><span className="text-foreground">Location:</span> {form.location}</p>
                      <p><span className="text-foreground">Ways to work:</span> {form.waysToWorkTogether}</p>
                    </div>
                  </div>
                )}

                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentStep === 0 || isDeploying || isUploadingPhoto}
                    onClick={() => {
                      setErrorMessage("");
                      setCurrentStep((step) => Math.max(0, step - 1));
                    }}
                  >
                    <ArrowLeft />
                    Back
                  </Button>

                  <Button type="submit" disabled={isDeploying || isUploadingPhoto}>
                    {currentStep === totalSteps - 1 ? (
                      <>
                        {isDeploying ? "Saving..." : "Save and open dashboard"}
                        <Rocket />
                      </>
                    ) : (
                      isUploadingPhoto ? "Uploading photo..." : "Next"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Onboarding;
