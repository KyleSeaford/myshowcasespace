import LegalDocumentPage from "@/components/LegalDocumentPage";

const sections = [
  {
    title: "About this Cookie Notice",
    paragraphs: [
      "This Cookie Notice explains how Rivo uses cookies and similar technologies, including local storage, pixels, scripts, SDKs, device identifiers, and related browser-side storage or telemetry tools.",
      "Some of these technologies are essential to make the service work. Others help us measure performance, understand usage, prevent abuse, or support third-party tools that we rely on or may enable in the future."
    ]
  },
  {
    title: "Essential cookies and similar technologies",
    paragraphs: [
      "Rivo uses essential first-party cookies to keep you signed in, secure your session, remember basic interface preferences, and protect the service against misuse. These cookies are necessary for core functionality and cannot be switched off through the site.",
      "Examples include our session cookie for authentication and security, and interface state storage used to remember simple product preferences. If you block essential cookies, parts of the service, including login, onboarding, dashboard access, and account management, may stop working properly."
    ]
  },
  {
    title: "Anti-abuse technologies",
    paragraphs: [
      "We may use bot-detection, rate-limiting, fraud-prevention, or abuse-monitoring services on payment, publishing, contact, password reset, or other abuse-sensitive flows. These tools may use cookies, browser storage, device signals, request metadata, interaction data, or related technical signals to distinguish legitimate users from bots or fraudulent traffic."
    ]
  },
  {
    title: "Analytics, diagnostics, and Vercel tooling",
    paragraphs: [
      "We may use Vercel-hosted analytics or performance tooling, including services such as Vercel Web Analytics and Speed Insights, or similar providers, to understand traffic patterns, diagnose errors, and measure page performance.",
      "Vercel's current Web Analytics documentation states that it can operate without third-party cookies and instead relies on aggregated request and telemetry data. Even where no third-party cookie is used, these tools may still collect technical information such as page URLs, referrers, filtered query parameters, browser type, operating system, device type, timestamp, and approximate geolocation."
    ]
  },
  {
    title: "Third-party services that may use cookies or similar technologies",
    paragraphs: [
      "Depending on which features are enabled, cookies or similar technologies may also be used by third-party providers involved in hosting, uploads, billing, fraud prevention, domain configuration, content delivery, embedded media, support tooling, or analytics.",
      "Based on the current service setup or planned integrations, these third parties may include Vercel, UploadThing, a database or infrastructure provider such as Neon, payment providers such as Stripe when billing is enabled, and other comparable hosting, monitoring, or security vendors. Not every provider listed here will necessarily set cookies in every context, and some may instead rely on scripts, request metadata, or other browser-side signals."
    ]
  },
  {
    title: "Types of cookies we may use",
    paragraphs: [
      "Cookies and similar technologies that may be used in connection with Rivo can generally be grouped into a few categories."
    ],
    bullets: [
      "Strictly necessary cookies for authentication, session integrity, routing, and basic security.",
      "Functional cookies or local storage for remembering interface state and preferences.",
      "Security and anti-fraud technologies, including abuse detection and rate-limiting services.",
      "Analytics and performance technologies used to understand traffic, feature usage, and site reliability.",
      "Third-party cookies or identifiers connected with embedded services, payment flows, or external integrations where those features are enabled."
    ]
  },
  {
    title: "Your choices",
    paragraphs: [
      "You can manage or block many cookies through your browser settings, content-blocking extensions, device controls, or privacy tools. You may also be able to clear local storage and similar browser-side data directly from your browser.",
      "If you block essential cookies or similar anti-abuse technologies, protected forms and account access features may fail. If we introduce a cookie banner or consent manager in the future, your choices there will apply in addition to your browser settings.",
      "Questions about our use of cookies or similar technologies can be sent to hello@tryrivo.org."
    ]
  },
  {
    title: "Updates to this notice",
    paragraphs: [
      "We may update this Cookie Notice from time to time to reflect changes in law, technology, vendors, or product features. If we make material changes, we may post an updated notice, update the effective date, or ask users to review updated legal terms when they next use the service."
    ]
  }
] as const;

const CookieNotice = () => {
  return (
    <LegalDocumentPage
      title="Cookie Notice"
      subtitle="How Rivo uses cookies and similar technologies, including anti-abuse, analytics, and core session tools."
      sections={[...sections]}
    />
  );
};

export default CookieNotice;
