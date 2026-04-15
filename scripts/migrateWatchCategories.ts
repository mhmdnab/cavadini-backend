import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const SLUGS_TO_REMOVE = ['men-watches', 'women-watches', 'children-watches'];

async function main(): Promise<void> {
  // 1. Find the target "watches" category
  const watchesCat = await prisma.category.findUnique({ where: { slug: 'watches' } });
  if (!watchesCat) throw new Error('Target category "watches" not found in DB');
  console.log(`✅ Target category: "${watchesCat.name}" (${watchesCat.id})\n`);

  // 2. Re-assign products for each redundant category
  for (const slug of SLUGS_TO_REMOVE) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      console.log(`⏭  "${slug}" — not found, skipping`);
      continue;
    }

    const result = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: {
        categoryId: watchesCat.id,
        category_type: 'watches',
      },
    });

    console.log(`🔄 "${cat.name}" → reassigned ${result.count} product(s) to "Watches"`);
  }

  // 3. Delete the redundant categories
  console.log('');
  for (const slug of SLUGS_TO_REMOVE) {
    const deleted = await prisma.category.deleteMany({ where: { slug } });
    if (deleted.count > 0) {
      console.log(`🗑  Deleted category "${slug}"`);
    } else {
      console.log(`⏭  "${slug}" — already gone`);
    }
  }

  // 4. Verify
  const remaining = await prisma.category.findMany({ select: { name: true, slug: true } });
  console.log('\nRemaining categories:');
  for (const c of remaining) console.log(`  • ${c.name} (${c.slug})`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
