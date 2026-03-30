import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";
import FadeInSection from "@/components/FadeInSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <FadeInSection>
        <ShowcaseSection />
      </FadeInSection>
      <FadeInSection>
        <FeaturesSection />
      </FadeInSection>
      <FadeInSection>
        <PricingSection />
      </FadeInSection>
      <FadeInSection>
        <CtaSection />
      </FadeInSection>
      <Footer />
    </div>
  );
};

export default Index;
