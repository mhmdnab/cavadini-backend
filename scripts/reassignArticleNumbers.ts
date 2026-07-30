/**
 * Item 6 — one-time reassignment of article numbers.
 *
 * Existing products hold eBay item numbers in `articleNumber` (those were only
 * ever used to locate photos). This replaces every non-KO article number with a
 * clean sequential KO-##### drawn from the same `article_number_seq` the create
 * endpoint uses, so old and new products share one scheme with no collisions.
 *
 * Ordered by createdAt so the oldest catalogue items get the lowest numbers.
 * Products that already have a KO-##### number are left untouched (idempotent).
 * Prints the full old → new mapping for the record.
 *
 * Run:
 *   npx dotenv -e .env -- ts-node scripts/reassignArticleNumbers.ts              (prod)
 *   npx dotenv -e .env.development -- ts-node scripts/reassignArticleNumbers.ts  (local)
 */
import prisma from '../src/lib/prisma';

const KO = /^KO-\d+$/;

async function nextArticleNumber(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('article_number_seq')`;
  return `KO-${String(Number(rows[0].nextval)).padStart(5, '0')}`;
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, articleNumber: true },
  });

  let changed = 0;
  for (const p of products) {
    if (p.articleNumber && KO.test(p.articleNumber)) continue; // already clean
    const next = await nextArticleNumber();
    await prisma.product.update({ where: { id: p.id }, data: { articleNumber: next } });
    console.log(`  ${(p.articleNumber ?? '(none)').padEnd(20)} → ${next}   ${p.name}`);
    changed++;
  }
  console.log(`\nreassigned ${changed} / ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
