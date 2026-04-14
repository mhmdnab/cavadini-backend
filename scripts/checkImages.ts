import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
    where: { images: { isEmpty: false } },
  });

  console.log(`Products with images: ${products.length}`);

  for (const p of products.slice(0, 3)) {
    console.log(`\n${p.name}:`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Images: ${JSON.stringify(p.images)}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());