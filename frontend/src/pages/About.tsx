import ContentPageLayout from "@/components/ContentPageLayout";

const values = [
  {
    title: "Fast to publish",
    description: "A focused flow helps you go from draft to live portfolio in minutes.",
  },
  {
    title: "Built for creatives",
    description: "Photographers, artists, students, and designers all need clear presentation tools.",
  },
];

const About = () => {
  return (
    <ContentPageLayout
      title="About MyShowcase"
      subtitle="MyShowcase is a portfolio platform built to make beautiful work feel effortless to present."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-5 text-muted-foreground font-light leading-relaxed">
          <p>
            We built MyShowcase for people who care deeply about visual presentation but do not want
            to manage a complex website stack.
          </p>
          <p>
            The goal is simple: publish a clean, professional portfolio that you are proud to share
            in your Instagram bio, email signature, and client pitches.
          </p>
          <p>
            From students building their first body of work to established studios refreshing their
            online presence, MyShowcase gives you a calm place to present your work.
          </p>
        </div>

        <div className="grid gap-4">
          {values.map((value) => (
            <div key={value.title} className="border border-border p-5">
              <h2 className="font-heading text-2xl text-foreground mb-2">{value.title}</h2>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>


    </ContentPageLayout>
  );
};

export default About;
