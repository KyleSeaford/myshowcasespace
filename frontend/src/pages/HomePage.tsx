import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="home-layout">
      <section className="hero-card">
        <p className="eyebrow">MyShowcase Space</p>
        <h1>Launch your artist site in one session.</h1>
        <p className="lead">
          Capture your brand profile, publish to your own showcase URL, and then manage pieces from your site admin.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/signup">
            Create Your Site
          </Link>
          <Link className="btn btn-secondary" to="/login">
            Log In
          </Link>
        </div>
      </section>

      <section className="value-grid">
        <article>
          <h2>Free plan that works</h2>
          <p>Subdomain publishing, strong profile defaults, and a clear path to site admin.</p>
        </article>
        <article>
          <h2>Built for growth</h2>
          <p>Upgrade to Pro for custom domains, more pieces, and expanded customization.</p>
        </article>
        <article>
          <h2>Tenant-powered backend</h2>
          <p>Every published site reads from your central platform data model and tenant API.</p>
        </article>
      </section>
    </main>
  );
}
