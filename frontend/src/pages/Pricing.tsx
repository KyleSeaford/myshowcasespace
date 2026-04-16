import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PricingSection from "@/components/PricingSection";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-16">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
