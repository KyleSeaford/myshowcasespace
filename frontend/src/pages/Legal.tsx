import ContentPageLayout from "@/components/ContentPageLayout";

const Legal = () => {
  return (
    <ContentPageLayout
      title="Legal"
      subtitle="Important policies for using MyShowcase. This page is a product placeholder and should be reviewed by legal counsel before launch."
    >
      <div className="grid gap-8">
        <section className="border border-border p-6">
          <h2 className="font-heading text-3xl text-foreground mb-3">Terms of Service</h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            By using MyShowcase, you agree to use the service lawfully, maintain accurate account
            details, and respect content ownership and intellectual property rules.
          </p>
        </section>

        <section className="border border-border p-6">
          <h2 className="font-heading text-3xl text-foreground mb-3">Privacy Policy</h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            We collect only the information needed to provide and improve the platform, including
            account details, billing records, and basic usage analytics.
          </p>
        </section>

        <section className="border border-border p-6">
          <h2 className="font-heading text-3xl text-foreground mb-3">Cookie Notice</h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Cookies are used for authentication, security, and analytics. You can control cookie
            behavior through your browser settings.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
};

export default Legal;
