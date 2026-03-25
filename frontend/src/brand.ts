export const brandSchemaFields = [
  "name",
  "email",
  "heroTitle",
  "tenantId",
  "adminPassword",
  "instagramHandle",
  "instagramUrl",
  "location",
  "siteTitle",
  "siteDescription",
  "aboutPhoto",
  "aboutPhotoAlt",
  "aboutParagraphs",
  "workTogetherItems"
] as const;

export type BrandSchemaField = (typeof brandSchemaFields)[number];

export interface BrandProfile {
  name: string;
  email: string;
  heroTitle: string;
  tenantId: string;
  adminPassword: string;
  instagramHandle: string;
  instagramUrl: string;
  location: string;
  siteTitle: string;
  siteDescription: string;
  aboutPhoto: string;
  aboutPhotoAlt: string;
  aboutParagraphs: string[];
  workTogetherItems: string[];
}

export const defaultBrandProfile: BrandProfile = {
  name: "Your Name",
  email: "you@example.com",
  heroTitle: "Selected Works",
  tenantId: "yourname-00000000",
  adminPassword: "choose-a-password",
  instagramHandle: "@yourhandle",
  instagramUrl: "https://instagram.com/yourhandle",
  location: "City, Country",
  siteTitle: "Portfolio | Your Name",
  siteDescription: "Photographer / visual artist description.",
  aboutPhoto: "/images/about-placeholder.jpg",
  aboutPhotoAlt: "Portrait of the artist",
  aboutParagraphs: [
    "Paragraph one about your practice.",
    "Paragraph two with your approach and focus.",
    "Paragraph three with collaborations or background."
  ],
  workTogetherItems: ["Commissions", "Purchase Prints"]
};
