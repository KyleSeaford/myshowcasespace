import LegalDocumentPage from "@/components/LegalDocumentPage";

const sections = [
  {
    title: "About this Privacy Policy",
    paragraphs: [
      "This Privacy Policy explains how Rivo collects, uses, stores, shares, and otherwise processes personal data when you visit our website, create an account, use our publishing tools, upload content, contact support, or interact with related legal pages, onboarding flows, and hosted showcase services.",
      "This policy is intended to cover the current Rivo setup and the service providers we use or reasonably expect to use as part of operating the platform. It should be reviewed by qualified legal counsel before launch, particularly once your final company details, payment setup, and anti-abuse tooling are settled."
    ]
  },
  {
    title: "What we collect",
    paragraphs: [
      "We collect information you give us directly, such as your account email address, password, profile details, contact details, showcase content, uploaded files, settings, social links, domain information, and any messages you send to support.",
      "We collect service and device information automatically, such as IP address, approximate location derived from IP, browser type, device type, operating system, request metadata, error logs, timestamps, security events, and usage information about how pages and features are accessed.",
      "If you buy or manage a paid plan, we may also collect billing and subscription records, invoice metadata, transaction references, and limited payment-related information from our payment providers. We do not intend to store full payment card numbers ourselves."
    ]
  },
  {
    title: "How we use personal data",
    paragraphs: [
      "We use personal data to create and secure your account, authenticate sessions, publish and host your showcase, process uploads, connect domains, respond to support requests, process subscriptions, and provide core platform functionality.",
      "We also use personal data to prevent abuse, investigate fraud, maintain system security, troubleshoot errors, monitor performance, understand product usage, and improve the reliability and usability of the service.",
      "Where allowed by law, we may also use account and usage data to communicate service updates, policy changes, billing notices, onboarding guidance, or important operational messages."
    ]
  },
  {
    title: "Legal bases and why processing happens",
    paragraphs: [
      "Depending on where you are located, we may process personal data because it is necessary to perform a contract with you, because we have legitimate interests in operating and securing the service, because we need to comply with legal obligations, or because you have given consent where consent is required.",
      "Our legitimate interests may include account administration, service improvement, abuse detection, fraud prevention, incident response, analytics, product development, and protecting the rights, property, and safety of Rivo, our users, and the public."
    ]
  },
  {
    title: "Third parties and service providers",
    paragraphs: [
      "We share personal data only where reasonably necessary with service providers and infrastructure partners that help us operate Rivo. Based on the current stack, those providers may include Vercel for hosting, deployment, and platform telemetry, Neon or another managed PostgreSQL provider for database hosting, UploadThing for file uploads and storage workflows, and hCaptcha or a similar challenge-response provider for spam, bot, and abuse prevention when enabled.",
      "If paid subscriptions are enabled, we may also use a payment processor such as Stripe to handle checkout, billing, recurring payments, invoicing, and payment-related records. Those providers process personal data under their own privacy notices and contractual obligations.",
      "We may also share data with domain registrars, DNS providers, email delivery providers, analytics providers, security tools, professional advisers, auditors, insurers, or law enforcement where required or reasonably necessary."
    ]
  },
  {
    title: "How data is shared",
    paragraphs: [
      "We may disclose personal data to service providers acting on our behalf, to affiliates or advisers supporting our operations, in connection with an acquisition, financing, reorganisation, or sale of assets, or where disclosure is required by law.",
      "We may also disclose information when we believe it is necessary to investigate abuse, respond to lawful requests, enforce our terms, protect intellectual property, or protect Rivo, our users, or the public from harm."
    ]
  },
  {
    title: "International transfers",
    paragraphs: [
      "Rivo and some of our service providers may process personal data outside your country of residence, including in the United Kingdom, European Economic Area, and United States, depending on how the service is configured and which providers are used.",
      "Where required, we rely on contractual, technical, and organisational safeguards intended to support lawful cross-border transfers, but international transfers may still involve jurisdictions with different data protection laws."
    ]
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We keep account records, security logs, billing records, support communications, and operational data for as long as needed to provide the service, comply with legal obligations, resolve disputes, prevent abuse, and enforce our agreements. Uploaded content and backups may persist for a limited period after deletion.",
      "We use reasonable technical and organisational measures to protect personal data, but no method of storage or transmission is completely secure. You are responsible for keeping your login credentials confidential and for maintaining your own backup copies of important content."
    ]
  },
  {
    title: "Your rights and choices",
    paragraphs: [
      "Depending on your location, you may have the right to request access to your personal data, correction of inaccurate data, deletion, restriction, portability, objection to certain processing, or withdrawal of consent where processing relies on consent.",
      "You may also be able to control some data use through your browser settings, device permissions, and cookie controls. If we rely on a third-party payment or anti-abuse provider, requests relating to those providers may also need to be directed to them or handled jointly with them depending on the circumstances.",
      "You can contact us at hello@getrivo.net to request help with access, correction, deletion, or other privacy questions."
    ]
  },
  {
    title: "Children and sensitive data",
    paragraphs: [
      "Rivo is not intended for young children, and we do not knowingly collect personal data from children where doing so would be prohibited by law. If you believe a child has provided personal data inappropriately, contact us so we can review and take appropriate action.",
      "Please do not upload sensitive personal data unless it is genuinely necessary and you have a lawful basis and all required permissions to share it."
    ]
  },
  {
    title: "Policy updates",
    paragraphs: [
      "We may update this Privacy Policy from time to time. If we make material changes, we may provide notice by posting the revised policy, updating the effective date, emailing the address associated with your account, or asking you to review updated terms when you next use the service."
    ]
  }
] as const;

const PrivacyPolicy = () => {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      subtitle="How Rivo collects, uses, stores, and shares account, content, support, and technical data."
      sections={[...sections]}
    />
  );
};

export default PrivacyPolicy;
