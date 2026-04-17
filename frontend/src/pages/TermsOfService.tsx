import LegalDocumentPage from "@/components/LegalDocumentPage";

const sections = [
  {
    title: "About these Terms",
    paragraphs: [
      "These Terms of Service govern your access to and use of Rivo, including our website, hosted portfolio tools, publishing features, custom domain tools, support interactions, and related services.",
      "By creating an account, logging in, uploading content, purchasing a plan, or otherwise using Rivo, you agree to these Terms of Service, our Privacy Policy, and our Cookie Notice. If you do not agree, do not use the service.",
      "These Terms are intended to cover the current Rivo product setup. They should be reviewed by a qualified lawyer before public launch, especially once the final legal entity name, address, and governing jurisdiction are confirmed."
    ]
  },
  {
    title: "Eligibility and account registration",
    paragraphs: [
      "You must be legally able to enter into a binding contract to use Rivo. If you are using the service on behalf of a business, studio, school, collective, or other organisation, you confirm that you have authority to bind that organisation to these Terms.",
      "You must provide accurate information when registering and keep your email address, password, billing details, and other account information up to date. You are responsible for all activity that happens under your account and for keeping your credentials confidential.",
      "We may refuse registration, require account verification, reclaim usernames or slugs that infringe rights or impersonate others, and disable credentials that are compromised or misused."
    ]
  },
  {
    title: "Your content and your responsibilities",
    paragraphs: [
      "You retain ownership of the content you upload or publish through Rivo, including text, images, project descriptions, and branding assets, subject to any rights you grant to us in these Terms.",
      "You are solely responsible for your content, your portfolio pages, your domain choices, and the consequences of publishing or sharing material through the service. You confirm that you have all rights, licences, permissions, and consents needed to upload, host, display, reproduce, and distribute that content.",
      "You grant Rivo a non-exclusive, worldwide, royalty-free licence to host, store, cache, copy, process, format, transmit, display, and distribute your content only to the extent necessary to operate, secure, back up, improve, and provide the service, including public display where you publish a site."
    ]
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "You may not use Rivo to upload, publish, store, or distribute unlawful or abusive material. That includes pornographic, sexually explicit, exploitative, hateful, harassing, deceptive, or violent content."
    ],
    bullets: [
      "Do not upload pornography or sexually explicit material.",
      "Do not upload content involving exploitation, abuse, or illegal activity.",
      "Do not upload child sexual abuse material, non-consensual intimate imagery, or content that sexualises minors.",
      "Do not upload defamatory, hateful, discriminatory, threatening, or harassing material.",
      "Do not use the service to threaten, harass, defraud, or mislead anyone."
    ]
  },
  {
    title: "Prohibited technical misuse",
    paragraphs: [
      "You may not misuse the service, our infrastructure, or other users' accounts. We can investigate misuse, remove content, throttle traffic, suspend access, or involve law enforcement where appropriate."
    ],
    bullets: [
      "Do not probe, scan, test, or bypass security or authentication measures.",
      "Do not scrape the service, harvest data, or use bots in a way that disrupts the platform or breaches another person's privacy.",
      "Do not upload malware, ransomware, spyware, harmful code, or content designed to interrupt, damage, or monitor systems.",
      "Do not interfere with domains, routing, availability, performance, or other users' use of the service.",
      "Do not resell, mirror, frame, reverse engineer, or build a competing service from the platform except where law clearly permits it."
    ]
  },
  {
    title: "Copyright, trademarks, and takedowns",
    paragraphs: [
      "You must only upload material that you own or that you have clear permission to use. Do not upload copyrighted works, trademarks, images, text, video, music, designs, or other material that infringes another person's rights.",
      "If you believe content on Rivo infringes your copyright or other intellectual property rights, contact hello@tryrivo.org with enough detail for us to identify the material, review the complaint, and contact the affected user where appropriate.",
      "We may remove allegedly infringing content, disable access, issue warnings, or terminate repeat infringers. If we later publish designated copyright agent details or a formal complaint process, that process will apply in addition to these Terms."
    ]
  },
  {
    title: "Our service and platform changes",
    paragraphs: [
      "Rivo may add, remove, pause, or change features, templates, storage limits, supported file types, integrations, plan limits, domain tools, or deployment workflows at any time. We may also release beta, preview, or experimental features that are offered as-is and may be changed or withdrawn without notice.",
      "We aim to keep the service available and reliable, but we do not guarantee uninterrupted availability, permanent feature support, or error-free operation."
    ]
  },
  {
    title: "Plans, fees, billing, and cancellation",
    paragraphs: [
      "Some parts of Rivo may be free, while others require a paid subscription or one-off payment. You agree to pay all applicable fees, taxes, and charges shown at checkout or in your account.",
      "If you sign up for a recurring plan, you authorise us and our payment providers to charge the applicable subscription fees on a recurring basis until you cancel. We will clearly present the material billing terms before charging you, including pricing, billing interval, renewal timing, and how to cancel.",
      "You can cancel future renewals through the methods we make available in the product or through support. Cancellation stops future recurring charges but does not automatically refund past charges unless required by law or expressly stated by us. Except where required by law, fees are non-refundable once a paid period has started.",
      "We may change pricing, plan limits, or included features prospectively. If we do, the change will apply no earlier than your next billing cycle after reasonable notice unless the change is required by law, tax, or a third-party supplier."
    ]
  },
  {
    title: "Custom domains, third-party services, and external content",
    paragraphs: [
      "If you connect a custom domain, use an external payment provider, or rely on third-party services such as hosting, analytics, email, social links, registrars, or integrations, those services may have their own terms and privacy policies.",
      "We are not responsible for third-party services, downtime outside our control, registrar errors, platform changes imposed by suppliers, or loss caused by your relationship with a third-party provider."
    ]
  },
  {
    title: "Suspension and termination",
    paragraphs: [
      "We may suspend, restrict, remove content from, or terminate your access to Rivo at any time if we reasonably believe you have breached these Terms, violated the law, created security or reputational risk, failed to pay charges, infringed third-party rights, or used the service in a way that may harm us, users, or the public.",
      "You may stop using the service at any time. On termination, your right to use the service ends immediately, but provisions that by their nature should survive termination will continue, including provisions relating to payment, intellectual property, disclaimers, limitation of liability, indemnity, and dispute resolution."
    ]
  },
  {
    title: "Feedback and intellectual property",
    paragraphs: [
      "Rivo and its software, branding, design elements, text, platform logic, and non-user content are owned by us or our licensors and are protected by intellectual property laws.",
      "If you send us suggestions, ideas, feedback, or requests about the service, you grant us a non-exclusive, worldwide, perpetual, irrevocable, royalty-free licence to use, copy, modify, and incorporate that feedback without restriction or compensation."
    ]
  },
  {
    title: "Disclaimers",
    paragraphs: [
      "Rivo is provided on an as-available and as-is basis to the maximum extent permitted by law. We do not promise that the service will be uninterrupted, secure, error-free, virus-free, suitable for your particular needs, or that it will preserve or back up content without fail.",
      "You are responsible for keeping your own copies of important content, checking your live site before publishing, and confirming that the service is appropriate for your professional, legal, and commercial requirements."
    ]
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Rivo and its affiliates, founders, contractors, and suppliers will not be liable for any indirect, incidental, special, exemplary, consequential, or punitive damages, or for any loss of profits, revenue, business, goodwill, data, or opportunity arising out of or related to the service.",
      "To the maximum extent permitted by law, our total aggregate liability for all claims arising out of or relating to the service will not exceed the greater of the amount you paid us in the 12 months before the event giving rise to the claim or GBP 100.",
      "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for fraud, fraudulent misrepresentation, death, or personal injury caused by negligence where applicable law prohibits such limitation."
    ]
  },
  {
    title: "Indemnity",
    paragraphs: [
      "You agree to indemnify and hold harmless Rivo and its affiliates, officers, staff, contractors, and suppliers from and against claims, liabilities, losses, damages, judgments, costs, and expenses, including reasonable legal fees, arising out of or related to your content, your use of the service, your breach of these Terms, or your violation of another person's rights."
    ]
  },
  {
    title: "Changes to the service or these Terms",
    paragraphs: [
      "We may update these Terms from time to time. If we make a material change, we may provide notice by posting the updated Terms, emailing the address associated with your account, or asking you to accept the revised Terms when you next log in.",
      "Your continued use of Rivo after the updated Terms take effect means you accept the revised Terms. If you do not agree to the revised Terms, you must stop using the service."
    ]
  },
  {
    title: "Governing law and disputes",
    paragraphs: [
      "Unless mandatory local consumer law requires otherwise, these Terms and any dispute or non-contractual claim connected with them are governed by the laws of England and Wales.",
      "Unless mandatory law says otherwise, the courts of England and Wales will have exclusive jurisdiction over disputes arising out of or relating to these Terms or the service.",
      "If your business is incorporated elsewhere and you want another governing law or venue, this section should be updated before launch."
    ]
  },
  {
    title: "Help and contact",
    paragraphs: [
      "If you need help with these Terms, account issues, subscription cancellation, or a copyright complaint, email hello@tryrivo.org."
    ]
  }
] as const;

const TermsOfService = () => {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      subtitle="The rules for using Rivo, including acceptable use, ownership, and account responsibilities."
      sections={[...sections]}
    />
  );
};

export default TermsOfService;
