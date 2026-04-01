import ContentPageLayout from "@/components/ContentPageLayout";
import { HELP_EMAIL, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

interface LegalDocumentPageProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

const LegalDocumentPage = ({ title, subtitle, sections }: LegalDocumentPageProps) => {
  return (
    <ContentPageLayout title={title} subtitle={subtitle}>
      <div className="grid gap-8">
        <section className="border border-border bg-background p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Effective date: {LEGAL_EFFECTIVE_DATE}
          </p>
          <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground">
            Questions about this policy can be sent to {HELP_EMAIL}.
          </p>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="border border-border bg-background p-6">
            <h2 className="mb-3 font-heading text-3xl text-foreground">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm font-light leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets ? (
              <ul className="mt-4 grid gap-2 text-sm font-light leading-relaxed text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </ContentPageLayout>
  );
};

export default LegalDocumentPage;
