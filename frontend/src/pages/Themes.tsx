import { Link } from "react-router-dom";
import darkScreenshot from "@/assets/dark.png";
import defaultScreenshot from "@/assets/default.png";
import sunnyScreenshot from "@/assets/sunny.png";
import ContentPageLayout from "@/components/ContentPageLayout";

const themePreviews = [
  {
    id: "dark",
    name: "Dark",
    description: "High contrast presentation for bold image-led portfolios.",
    screenshot: darkScreenshot
  },
  {
    id: "sunny",
    name: "Sunny",
    description: "Bright, warm, and open for work with color and energy.",
    screenshot: sunnyScreenshot
  },
  {
    id: "default",
    name: "Default",
    description: "Quiet, balanced, and ready for clean professional portfolios.",
    screenshot: defaultScreenshot
  }
] as const;

const Themes = () => {
  return (
    <ContentPageLayout
      title="Themes"
      subtitle="Pick the visual direction that fits the work before locking it in from Settings."
    >
      <div className="space-y-10">
        <section className="grid gap-5 border border-border bg-secondary/20 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Theme choice</p>
            <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              Personal and Studio sites can choose from Dark, Sunny, and Default. Starter sites use Default.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center border border-foreground bg-foreground px-5 py-3 text-sm text-background transition-opacity hover:opacity-90"
          >
            Open Settings
          </Link>
        </section>

        <section className="grid gap-8">
          {themePreviews.map((theme) => (
            <article key={theme.id} className="grid gap-5 border border-border bg-background p-5 lg:grid-cols-[0.42fr_0.58fr] lg:p-6">
              <div className="flex flex-col justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{theme.id}</p>
                  <h2 className="mt-3 font-heading text-4xl text-foreground md:text-5xl">{theme.name}</h2>
                  <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                    {theme.description}
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <p className="border-t border-border pt-3">Portfolio grid, About details, contact links.</p>
                  <p className="border-t border-border pt-3">Responsive layout for desktop and mobile screens.</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
                <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
                  <span className="font-medium">Rivo Preview</span>
                  <span>{theme.name}</span>
                </div>
                <img
                  src={theme.screenshot}
                  alt={`${theme.name} theme screenshot`}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </ContentPageLayout>
  );
};

export default Themes;
