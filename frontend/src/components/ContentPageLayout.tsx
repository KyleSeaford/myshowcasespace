import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

interface ContentPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const ContentPageLayout = ({ title, subtitle, children }: ContentPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-28 pb-20">
        <section className="max-w-7xl mx-auto px-6 md:px-10 mb-14">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">{title}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground font-light leading-relaxed">{subtitle}</p>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10">{children}</section>
      </main>

      <Footer />
    </div>
  );
};

export default ContentPageLayout;
