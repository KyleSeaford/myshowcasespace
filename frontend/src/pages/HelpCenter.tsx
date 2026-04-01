import ContentPageLayout from "@/components/ContentPageLayout";

const faqs = [
  {
    question: "How do I start for free?",
    answer:
      "Choose the Starter plan and publish to a myshowcase.site subdomain. You can upgrade later when you want custom domain support.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes. Personal and Studio plans support custom domains. You can connect your domain from the dashboard in a few steps.",
  },
  {
    question: "Do I need coding skills?",
    answer:
      "No. MyShowcase is built for creatives and students. You can upload, arrange, and publish through a simple editor.",
  },
  {
    question: "Can I keep projects private while editing?",
    answer:
      "Yes. Draft mode lets you prepare new work before making it visible on your live portfolio.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Your plan is downgraded at the end of the billing period. Your content remains available based on your active plan limits.",
  },
];

const HelpCenter = () => {
  return (
    <ContentPageLayout
      title="Help Center"
      subtitle="Everything you need to launch and manage your portfolio with confidence."
    >
      <div className="grid gap-4 md:gap-5">
        {faqs.map((item) => (
          <details key={item.question} className="border border-border bg-background p-5 md:p-6">
            <summary className="cursor-pointer list-none font-heading text-2xl text-foreground">
              {item.question}
            </summary>
            <p className="mt-3 text-muted-foreground font-light leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </ContentPageLayout>
  );
};

export default HelpCenter;
