const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-14">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-3">
            <p className="font-heading text-3xl text-foreground">Rivo</p>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
              A calm, premium portfolio platform for photographers, artists, students, and
              creative teams.
            </p>
            <p className="text-sm text-muted-foreground font-light">hello@getrivo.net</p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.12em] text-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="/#showcase" className="hover:text-foreground transition-colors">Examples</a></li>
              <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.12em] text-foreground mb-3">Legal Docs</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="/legal/cookie-notice" className="hover:text-foreground transition-colors">Cookies</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.12em] text-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="/help-center" className="hover:text-foreground transition-colors">Help center</a></li>
              <li><a href="/blog" className="hover:text-foreground transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>Copyright {currentYear} Rivo. All rights reserved.</span>
          <span>Made by <a href="https://insightxpert.co.uk" className="hover:text-foreground transition-colors">InsightXpert</a></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
