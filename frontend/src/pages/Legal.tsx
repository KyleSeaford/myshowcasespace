import { Link } from "react-router-dom";
import ContentPageLayout from "@/components/ContentPageLayout";
import { HELP_EMAIL, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

const documents = [
  {
    title: "Privacy Policy",
    href: "/legal/privacy-policy",
    description: "How account data, uploaded content, technical logs, and support information are handled."
  },
  {
    title: "Cookie Notice",
    href: "/legal/cookie-notice",
    description: "How Rivo uses essential cookies and Vercel-hosted analytics or performance tooling."
  },
  {
    title: "Terms of Service",
    href: "/legal/terms-of-service",
    description: "The rules for acceptable use, uploaded content, copyright ownership, and account access."
  }
] as const;

const Legal = () => {
  return (
    <ContentPageLayout
      title="Legal"
      subtitle="The key rules and policies that apply when someone creates an account, logs in, uploads work, or uses Rivo."
    >
      <div className="grid gap-8">
        <section className="border border-border bg-background p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Effective date: {LEGAL_EFFECTIVE_DATE}
          </p>
          <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground">
            Questions about account use, privacy, cookies, or copyright complaints can be sent to {HELP_EMAIL}.
          </p>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          {documents.map((document) => (
            <Link
              key={document.href}
              to={document.href}
              className="border border-border bg-background p-6 transition-colors hover:border-foreground"
            >
              <h2 className="mb-3 font-heading text-3xl text-foreground">{document.title}</h2>
              <p className="text-sm font-light leading-relaxed text-muted-foreground">
                {document.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default Legal;
