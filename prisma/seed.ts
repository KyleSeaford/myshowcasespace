import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function main(): Promise<void> {
  await prisma.plan.upsert({
    where: { id: "free" },
    update: { name: "Free", pieceLimit: 3, monthlyPrice: 0 },
    create: { id: "free", name: "Free", pieceLimit: 3, monthlyPrice: 0 }
  });

  await prisma.plan.upsert({
    where: { id: "pro" },
    update: { name: "Personal", pieceLimit: 50, monthlyPrice: 500 },
    create: { id: "pro", name: "Personal", pieceLimit: 50, monthlyPrice: 500 }
  });

  await prisma.plan.upsert({
    where: { id: "studio" },
    update: { name: "Studio", pieceLimit: 200, monthlyPrice: 1200 },
    create: { id: "studio", name: "Studio", pieceLimit: 200, monthlyPrice: 1200 }
  });

  const demoEmail = "demo@myshowcase.space";
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash },
    create: {
      email: demoEmail,
      passwordHash
    }
  });

  const tenantSlug = "demo-artist";
  const tenantCode = "DEMOART123";

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {
      ownerUserId: demoUser.id,
      planId: "free",
      published: true,
      publishedUrl: `https://${tenantSlug}.myshowcase.space`
    },
    create: {
      ownerUserId: demoUser.id,
      planId: "free",
      name: "Demo Artist",
      slug: tenantSlug,
      bio: "A sample showcase profile created by seed.",
      contactEmail: demoEmail,
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/demoartist"
      }),
      theme: JSON.stringify({
        primaryColor: "#1A365D",
        accentColor: "#F6AD55",
        font: "Instrument Sans",
        layout: "editorial"
      }),
      tenantCode,
      published: true,
      publishedUrl: `https://${tenantSlug}.myshowcase.space`
    }
  });

  await prisma.domain.upsert({
    where: { hostname: `${tenantSlug}.myshowcase.space` },
    update: {
      tenantId: demoTenant.id,
      type: "SUBDOMAIN",
      verified: true,
      isPrimary: true
    },
    create: {
      tenantId: demoTenant.id,
      type: "SUBDOMAIN",
      hostname: `${tenantSlug}.myshowcase.space`,
      verified: true,
      isPrimary: true
    }
  });

  await prisma.billingAccount.upsert({
    where: { tenantId: demoTenant.id },
    update: {
      status: "INACTIVE"
    },
    create: {
      tenantId: demoTenant.id,
      status: "INACTIVE"
    }
  });

  const rawApiKey = "mssk_demo_seed_api_key_123456";
  const keyHash = sha256(rawApiKey);

  const existingKey = await prisma.apiKey.findFirst({
    where: {
      tenantId: demoTenant.id,
      keyHash,
      revokedAt: null
    }
  });

  if (!existingKey) {
    await prisma.apiKey.create({
      data: {
        tenantId: demoTenant.id,
        keyHash,
        keyPreview: "mssk_demo_se...",
        label: "seed"
      }
    });
  }

  const seededPieces = [
    {
      title: "Residue of Light",
      slug: "residue-of-light",
      description: "Mixed-media piece exploring time and memory.",
      year: 2024,
      category: "Mixed Media",
      images: ["https://images.example.com/residue-of-light.jpg"]
    },
    {
      title: "Concrete Bloom",
      slug: "concrete-bloom",
      description: "Sculptural installation balancing fragile forms.",
      year: 2025,
      category: "Sculpture",
      images: ["https://images.example.com/concrete-bloom.jpg"]
    }
  ];

  for (const piece of seededPieces) {
    await prisma.piece.upsert({
      where: {
        tenantId_slug: {
          tenantId: demoTenant.id,
          slug: piece.slug
        }
      },
      update: {
        ...piece,
        images: JSON.stringify(piece.images),
        published: true
      },
      create: {
        tenantId: demoTenant.id,
        ...piece,
        images: JSON.stringify(piece.images),
        published: true
      }
    });
  }

  console.log("Seed complete.");
  console.log(`Demo login: ${demoEmail} / Password123!`);
  console.log(`Demo tenant code: ${tenantCode}`);
  console.log(`Demo tenant API key: ${rawApiKey}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
