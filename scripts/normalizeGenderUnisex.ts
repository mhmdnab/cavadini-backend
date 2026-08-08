// Item 6: normalize any legacy gender value "--" (or empty-ish placeholders) to
// the canonical "Unisex". Safe + idempotent — run against local first, then prod.
//   Local:  npx dotenv -e .env.development -- npx ts-node scripts/normalizeGenderUnisex.ts
//   Prod:   npx ts-node scripts/normalizeGenderUnisex.ts   (uses .env)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.product.count({ where: { gender: '--' } });
  const res = await prisma.product.updateMany({
    where: { gender: '--' },
    data: { gender: 'Unisex' },
  });
  console.log(`gender "--" rows found: ${before}; updated to "Unisex": ${res.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
