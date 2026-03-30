import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const tenant = await prisma.tenant.findUnique({ where: { slug: "kyleseaford" }, select: { id: true, slug: true, theme: true } });
console.log(JSON.stringify(tenant, null, 2));
await prisma.$disconnect();