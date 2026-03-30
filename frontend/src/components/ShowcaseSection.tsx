import portfolio1 from "@/assets/image.png";

const showcaseHighlights = [
  {
    title: "Custom domains",
    description: "Use your own domain name or start with a free myshowcase.site address.",
  },
  {
    title: "Easy to edit",
    description: "Upload, rearrange, and publish your work without touching code.",
  },
  {
    title: "Fast publishing",
    description: "Changes go live quickly, so your portfolio always stays current.",
  },
];

const ShowcaseSection = () => {
  return (
    <section id="showcase" className="py-28 md:py-36 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground text-center mb-14 md:mb-16">
          Simple &amp; Elegant Portfolio Sites
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="relative w-full max-w-3xl mx-auto">
            <div className="rounded-t-2xl border border-border bg-[#1f1f1f] p-3 shadow-[0_25px_60px_rgba(0,0,0,0.15)]">
              <div className="overflow-hidden rounded-lg bg-secondary border border-border">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 text-[11px] text-muted-foreground">
                  <span>myshowcase.site</span>
                  <span>Gallery | About | Contact</span>
                </div>
                <img
                  src={portfolio1}
                  alt="Portfolio preview shown inside laptop screen"
                  className="w-full h-[200px] md:h-[340px] object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="mx-auto h-2.5 w-[88%] bg-gradient-to-b from-zinc-400/70 to-zinc-500/40 rounded-b-[999px]" />
            <div className="mx-auto -mt-0.5 h-1.5 w-[48%] bg-zinc-400/35 rounded-b-[999px]" />
          </div>

          <div className="space-y-7">
            {showcaseHighlights.map((item) => (
              <div key={item.title} className="pt-3 border-t border-border first:border-t-0 first:pt-0">
                <h3 className="font-heading text-2xl text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
