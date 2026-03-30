const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-14">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-3">
            <p className="font-heading text-3xl text-foreground">MyShowcase</p>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
              A calm, premium portfolio platform for photographers, artists, students, and
              creative teams.
            </p>
            <p className="text-sm text-muted-foreground font-light">support@myshowcase.site</p>
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
            <h3 className="text-xs uppercase tracking-[0.12em] text-foreground mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/help-center" className="hover:text-foreground transition-colors">Help center</a></li>
              <li><a href="/legal" className="hover:text-foreground transition-colors">Legal</a></li>
              <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.12em] text-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="/blog" className="hover:text-foreground transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>Copyright {currentYear} MyShowcase. All rights reserved.</span>
          <span>Made by <a href="https://insightxpert.co.uk" className="hover:text-foreground transition-colors">InsightXpert</a></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
