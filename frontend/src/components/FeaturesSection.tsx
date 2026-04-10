const features = [
  {
    title: "Custom domains",
    description: "Use your own domain or start with a free GetRivo.net address.",
  },
  {
    title: "Fast setup",
    description: "Upload your work and publish in minutes, not hours.",
  },
  {
    title: "Clean layouts",
    description: "Minimal presentation styles designed around your images.",
  },
  {
    title: "Mobile ready",
    description: "Every portfolio looks great on any device, automatically.",
  },
  {
    title: "Private drafts",
    description: "Prepare new projects in private before publishing publicly.",
  },
  {
    title: "Simple pricing",
    description: "Transparent pricing with no hidden fees.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 md:py-40 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-6">
          Simple by design, stronger in use
        </h2>
        <p className="text-muted-foreground font-light text-lg leading-relaxed max-w-2xl mb-14 md:mb-16">
          Rivo keeps the interface quiet while still giving you everything you need to publish
          confidently and keep your portfolio current.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-10">
          {features.map((f, i) => (
            <div key={i} className="space-y-3 border-t border-border pt-5">
              <h3 className="font-heading text-xl text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
