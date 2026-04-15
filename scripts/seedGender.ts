import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const GENDER_MAP: Record<string, string> = {
  'men-watches':      'Men',
  'women-watches':    'Women',
  'children-watches': 'Children',
};

async function main(): Promise<void> {
  let updated = 0;
  let skipped = 0;

  for (const [categoryType, gender] of Object.entries(GENDER_MAP)) {
    const result = await prisma.product.updateMany({
      where: { category_type: categoryType },
      data: { gender },
    });

    if (result.count > 0) {
      console.log(`✅ ${categoryType} → gender="${gender}" (${result.count} product(s))`);
      updated += result.count;
    } else {
      console.log(`⏭  ${categoryType} → no products found`);
      skipped++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} category types had no products`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
