import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio6 from "@/assets/portfolio-6.jpg";
import portfolio7 from "@/assets/portfolio-7.jpg";
import portfolio8 from "@/assets/portfolio-8.jpg";
import portfolio5 from "@/assets/portfolio-5.jpg";

const templates = [
  {
    name: "Grid",
    description: "A clean image grid for visual portfolios",
    images: [portfolio1, portfolio3, portfolio7, portfolio6],
  },
  {
    name: "Case Study",
    description: "Full-width layouts for in-depth projects",
    images: [portfolio8],
  },
  {
    name: "Minimal Gallery",
    description: "A focused, single-column gallery",
    images: [portfolio5],
  },
];

const TemplatesSection = () => {
  return (
    <section className="py-28 md:py-40 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-16 md:mb-20">
          Start with a template
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {templates.map((t, i) => (
            <div key={i} className="space-y-4">
              {/* Template preview */}
              <div className="bg-secondary overflow-hidden">
                {t.images.length > 1 ? (
                  <div className="grid grid-cols-2 gap-1 p-3">
                    {t.images.map((img, j) => (
                      <img
                        key={j}
                        src={img}
                        alt={t.name}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src={t.images[0]}
                    alt={t.name}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div>
                <h3 className="font-heading text-lg text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground font-light">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplatesSection;
