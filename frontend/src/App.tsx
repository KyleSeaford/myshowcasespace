import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import About from "./pages/About.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPostPage from "./pages/BlogPost.tsx";
import CookieNotice from "./pages/CookieNotice.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import HelpCenter from "./pages/HelpCenter.tsx";
import Index from "./pages/Index.tsx";
import LaunchReady from "./pages/LaunchReady.tsx";
import Legal from "./pages/Legal.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Settings from "./pages/Settings.tsx";
import Start from "./pages/Start.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import Themes from "./pages/Themes.tsx";

const queryClient = new QueryClient();

const HashScrollHandler = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const sectionId = decodeURIComponent(hash.replace("#", ""));
    const headerOffset = 80;
    let attempts = 0;
    const maxAttempts = 20;

    const scrollToSection = () => {
      const section = document.getElementById(sectionId);
      if (!section) {
        if (attempts < maxAttempts) {
          attempts += 1;
          window.setTimeout(scrollToSection, 50);
        }
        return;
      }

      const targetTop = section.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    };

    scrollToSection();
  }, [pathname, hash]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <HashScrollHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/cookie-notice" element={<CookieNotice />} />
          <Route path="/legal/terms-of-service" element={<TermsOfService />} />
          <Route path="/start" element={<Start />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/themes" element={<Themes />} />
          <Route path="/launch-ready" element={<LaunchReady />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
