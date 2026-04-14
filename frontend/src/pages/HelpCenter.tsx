import { Link } from "react-router-dom";
import {
  ArrowRight,
  ExternalLink,
  LifeBuoy,
  LockKeyhole,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import ContentPageLayout from "@/components/ContentPageLayout";
import { HELP_EMAIL } from "@/lib/legal";

const pageLinks = [
  { label: "Quick start", href: "#quick-start" },
  { label: "Walkthroughs", href: "#walkthroughs" },
  { label: "Managing content", href: "#manage-content" },
  { label: "Plans and billing", href: "#plans-billing" },
  { label: "Troubleshooting", href: "#troubleshooting" },
  { label: "Account and security", href: "#account-security" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" }
] as const;

const quickStartStages = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Use the Start page to sign up or log back in. You need to accept the legal terms before continuing."
  },
  {
    step: "02",
    title: "Complete onboarding",
    description:
      "Work through the five onboarding steps to name your site, add your profile details, upload an About photo, set contact links, and create your site-level admin password."
  },
  {
    step: "03",
    title: "Open your dashboard",
    description:
      "After saving, the dashboard shows your live URL, a preview of the published site, a link to Settings, and the handoff into /admin for managing pieces."
  },
  {
    step: "04",
    title: "Add work and share",
    description:
      "Open /admin from your live site, add your pieces, publish the ones you want visible, then share your public URL once the portfolio looks right."
  }
] as const;

const walkthroughs = [
  {
    title: "Start and account access",
    description:
      "Best if you have not created an account yet or you were signed out and need to get back into the product.",
    href: "/start",
    cta: "Open Start",
    steps: [
      "Choose whether you are creating an account or logging in.",
      "Enter your email and password. New accounts require password confirmation.",
      "Accept the Terms, Privacy Policy, and Cookie Notice.",
      "Submit the form.",
      "New accounts continue to onboarding. Existing accounts go to onboarding or the dashboard depending on whether a site already exists."
    ]
  },
  {
    title: "Build your first site in onboarding",
    description:
      "This is the main setup flow for getting a portfolio live quickly with the correct profile and public details.",
    href: "/onboarding",
    cta: "Open Onboarding",
    steps: [
      "Step 1 sets your site name and auto-generates the public slug.",
      "Step 2 adds the hero title, creator name, discipline, bio, and About photo.",
      "Step 3 adds your contact email, location, ways to work together, and optional social links.",
      "Step 4 creates the admin password used later for /admin access on the site itself.",
      "Step 5 reviews everything before saving and opening the dashboard."
    ]
  },
  {
    title: "Edit your site details later",
    description:
      "Use Settings when your portfolio already exists and you want to refresh the presentation without rebuilding the whole site.",
    href: "/settings",
    cta: "Open Settings",
    steps: [
      "Update the hero title, bio, creator name, discipline, location, and ways to work together.",
      "Replace or remove the About photo and save the latest contact information.",
      "Update Instagram, X, and Pinterest links when needed.",
      "Change the site-level admin password if you want a new password for /admin.",
      "Note that the site name and slug are locked after setup."
    ]
  }
] as const;

const contentChecklist = [
  "Prepare a clear title and slug for each piece so your URLs stay tidy and consistent.",
  "Use strong cover images first. Each piece can include multiple images, so plan the order before publishing.",
  "Keep descriptions concise and informative. Add year and category when they help viewers understand the work.",
  "Publish only the pieces that are ready for the public site. Unpublished items should stay out of the live portfolio.",
  "Watch your plan limits. Starter is capped at 3 pieces, while paid plans allow larger libraries."
] as const;

const planCards = [
  {
    name: "Starter",
    price: "GBP 0/month",
    points: [
      "Good for testing the platform or launching a first simple portfolio.",
      "Includes a GetRivo.net address and mobile-ready presentation.",
      "Best fit when you only need a small set of featured work."
    ]
  },
  {
    name: "Personal",
    price: "GBP 5/month",
    points: [
      "Built for a fuller working portfolio with more room for projects.",
      "Useful once Starter limits begin to block new uploads or you need more flexibility.",
      "A sensible step up for solo creatives maintaining an active body of work."
    ]
  },
  {
    name: "Studio",
    price: "GBP 12/month",
    points: [
      "Designed for larger libraries, client-facing portfolios, and more advanced setup needs.",
      "Best when you want the highest piece capacity and the most complete presentation setup.",
      "The right direction if your site is already part of your professional workflow."
    ]
  }
] as const;

const troubleshootingGuides = [
  {
    title: "I was sent back to Start",
    answer:
      "The dashboard, onboarding, and settings pages require an active session. If your session expires, sign in again on Start and continue from there."
  },
  {
    title: "My About photo did not upload",
    answer:
      "Retry the upload and wait for the upload state to finish before moving on. Supported image formats include PNG, JPEG, WebP, and GIF."
  },
  {
    title: "The live site preview does not load in the dashboard",
    answer:
      "Open the live site in a new tab using the dashboard button. Some sites will not render well inside an iframe even when the site itself is available."
  },
  {
    title: "I cannot add another piece",
    answer:
      "You have likely reached the current plan limit. Starter allows up to 3 pieces, and larger plans increase the allowance."
  },
  {
    title: "I forgot which password to use",
    answer:
      "Your account password signs you into Rivo itself. Your admin password is separate and is used only inside /admin on the published site."
  },
  {
    title: "My site information changed but the page still looks old",
    answer:
      "Save your changes in Settings, then refresh the live site in a new tab. If the old content remains, re-open the dashboard and confirm the correct site URL."
  }
] as const;

const securityNotes = [
  "Account password: used for the main Rivo login.",
  "Admin password: used only for /admin access on your published site.",
  "Legal acceptance: required before account access is granted.",
  "Locked fields: site name and slug are treated as fixed after setup, so choose them carefully during onboarding."
] as const;

const faqs = [
  {
    question: "Do I need coding skills to use Rivo?",
    answer:
      "No. The main flow is built around forms, uploads, and guided steps rather than code."
  },
  {
    question: "When is my site actually live?",
    answer:
      "A live URL is created as part of the onboarding flow. The dashboard then shows that URL and gives you a preview and direct open link."
  },
  {
    question: "Where do I add or manage portfolio pieces?",
    answer:
      "Use the /admin area linked from the dashboard. That is the handoff point for adding, publishing, and managing work on the live site."
  },
  {
    question: "Can I update the hero text and profile later?",
    answer:
      "Yes. Use Settings to update the hero title, bio, creator details, About photo, contact info, social links, and admin password."
  },
  {
    question: "Can I change my site slug after launch?",
    answer:
      "Not from the current settings screen. Site name and slug are treated as locked after the initial setup flow."
  },
  {
    question: "What should I do before sharing my site?",
    answer:
      "Open the live URL, confirm the About section and contact details look right, make sure the correct pieces are published, and then share the public link."
  }
] as const;

const HelpCenter = () => {
  return (
    <ContentPageLayout
      title="Help Center"
      subtitle="A practical guide to setting up your account, building your site, managing your work, and fixing common issues without guesswork."
    >
      <div className="grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="self-start xl:sticky xl:top-24">
          <div className="space-y-6 border border-border bg-background p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">On this page</p>
              <nav className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {pageLinks.map((link) => (
                  <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Need help</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                If you are blocked by login, publishing, or content issues, contact{" "}
                <a href={`mailto:${HELP_EMAIL}`} className="text-foreground underline underline-offset-4">
                  {HELP_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border border-border bg-secondary/20 p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Support overview</p>
              <h2 className="mt-4 font-heading text-3xl text-foreground md:text-4xl">
                The product is simple, but the journey still has stages.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                Rivo is not just a public homepage. There is a clear path through account access,
                onboarding, dashboard review, site admin, and later updates in Settings. This help center
                is organized around that real flow so you can find the next right action quickly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/start"
                  className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-sm text-background transition-opacity hover:opacity-90"
                >
                  Open Start
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  Read product notes
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="border border-border bg-background p-5">
                <div className="flex items-center gap-3 text-foreground">
                  <Rocket className="h-4 w-4" />
                  <p className="text-sm">Fastest route to launch</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Start, finish onboarding, open the dashboard, then use /admin to add the work you want live.
                </p>
              </div>

              <div className="border border-border bg-background p-5">
                <div className="flex items-center gap-3 text-foreground">
                  <Settings2 className="h-4 w-4" />
                  <p className="text-sm">Best place for edits</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Use Settings for profile and presentation changes. Use /admin for actual portfolio pieces.
                </p>
              </div>

              <div className="border border-border bg-background p-5">
                <div className="flex items-center gap-3 text-foreground">
                  <LockKeyhole className="h-4 w-4" />
                  <p className="text-sm">Two passwords matter</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Your account password signs you into Rivo. Your admin password is separate and opens /admin.
                </p>
              </div>
            </div>
          </section>

          <section id="quick-start" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Quick start</p>
              <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                From blank account to public portfolio
              </h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                If you just want the straightest path, follow these four stages in order. Everything else on
                this page expands on them.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {quickStartStages.map((stage) => (
                <div key={stage.step} className="border border-border bg-secondary/20 p-5">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{stage.step}</p>
                  <h3 className="mt-3 font-heading text-2xl text-foreground">{stage.title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="walkthroughs" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Walkthroughs</p>
              <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                Use the right page for the right job
              </h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                The site already separates the product into a few clear roles. These walkthroughs explain what
                each stage is for and when you should use it.
              </p>
            </div>

            <div className="mt-8 grid gap-5">
              {walkthroughs.map((guide) => (
                <article key={guide.title} className="border border-border bg-secondary/20 p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <h3 className="font-heading text-2xl text-foreground">{guide.title}</h3>
                      <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>

                    <Link
                      to={guide.href}
                      className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                    >
                      {guide.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <ol className="mt-5 grid gap-3 text-sm text-muted-foreground">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="border-t border-border pt-3">
                        <span className="text-foreground">{index + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section id="manage-content" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Managing content</p>
                <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                  What happens in /admin
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                  Dashboard and Settings help you manage the site itself. The actual portfolio entries live in the
                  admin area linked from the dashboard. That is where you add, edit, publish, and remove pieces.
                </p>

                <div className="mt-6 border border-border bg-secondary/20 p-5">
                  <p className="text-sm text-foreground">Typical piece information</p>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                    A piece can include a title, slug, description, year, category, published state, and a set of
                    images. Plan the naming and image order before you publish so the public site stays clean.
                  </p>
                </div>
              </div>

              <div className="border border-border bg-secondary/20 p-5 md:p-6">
                <p className="text-sm text-foreground">Recommended checklist</p>
                <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                  {contentChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="font-light leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="plans-billing" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Plans and billing</p>
              <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                When to stay put and when to upgrade
              </h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                The easiest signal to upgrade is when your current plan starts limiting how much work you can show
                or how polished you need the final setup to feel for clients and collaborators.
              </p>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {planCards.map((plan) => (
                <article key={plan.name} className="border border-border bg-secondary/20 p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{plan.price}</p>
                  <h3 className="mt-3 font-heading text-3xl text-foreground">{plan.name}</h3>
                  <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
                    {plan.points.map((point) => (
                      <li key={point} className="border-t border-border pt-3 font-light leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="mt-6 border border-border bg-secondary/20 p-5 md:p-6">
              <p className="text-sm text-foreground">Billing notes</p>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                Upgrade prompts live around the dashboard and pricing section. If you want a custom domain or need
                more room for work, review the pricing page first and then upgrade from the logged-in flow tied to
                your site.
              </p>
            </div>
          </section>

          <section id="troubleshooting" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Troubleshooting</p>
              <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                Common issues and the quickest fix
              </h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {troubleshootingGuides.map((guide) => (
                <article key={guide.title} className="border border-border bg-secondary/20 p-5">
                  <h3 className="font-heading text-2xl text-foreground">{guide.title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{guide.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="account-security" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Account and security</p>
                <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                  The important account rules to remember
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                  Most access problems come down to using the wrong password, skipping the legal checkbox, or losing
                  the session needed for protected pages. Keep these distinctions clear and the product stays simple.
                </p>
              </div>

              <div className="grid gap-4">
                {securityNotes.map((note) => (
                  <div key={note} className="border border-border bg-secondary/20 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm font-light leading-relaxed text-muted-foreground">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="scroll-mt-28 border border-border bg-background p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">FAQ</p>
              <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                Short answers for the most common questions
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:gap-5">
              {faqs.map((item) => (
                <details key={item.question} className="border border-border bg-secondary/20 p-5 md:p-6">
                  <summary className="cursor-pointer list-none font-heading text-2xl text-foreground">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section id="support" className="scroll-mt-28 border border-border bg-secondary/20 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Support</p>
                <h2 className="mt-3 font-heading text-3xl text-foreground md:text-4xl">
                  When you need a human answer
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                  Include the page you were on, the site URL or tenant name you were working with, and the exact
                  point where the flow stopped. That makes it much easier to resolve account, upload, or publishing
                  problems quickly.
                </p>
              </div>

              <div className="grid gap-4">
                <a
                  href={`mailto:${HELP_EMAIL}`}
                  className="border border-border bg-background p-5 transition-colors hover:border-foreground"
                >
                  <div className="flex items-center gap-3 text-foreground">
                    <LifeBuoy className="h-4 w-4" />
                    <p className="text-sm">Email support</p>
                  </div>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{HELP_EMAIL}</p>
                </a>

                <Link
                  to="/legal"
                  className="border border-border bg-background p-5 transition-colors hover:border-foreground"
                >
                  <p className="text-sm text-foreground">Review legal documents</p>
                  <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                    Terms, privacy, and cookie guidance live in one place if you need the policy details behind the
                    platform.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default HelpCenter;
