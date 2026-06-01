import 'dotenv/config';
import prisma from '../src/lib/prisma';

// Non-destructive: adds the 14 new watch brands as empty slots (no products yet)
// without touching any existing brand. Upserts by slug, so it is safe to re-run.
const newBrands = [
  { name: 'Almanus', slug: 'almanus' },
  { name: 'Alpina', slug: 'alpina' },
  { name: 'Astboerg', slug: 'astboerg' },
  { name: 'Baumier', slug: 'baumier' },
  { name: 'Bulova', slug: 'bulova' },
  { name: 'Casio', slug: 'casio' },
  { name: 'Chenevard', slug: 'chenevard' },
  { name: 'Breil', slug: 'breil' },
  { name: 'Dugena', slug: 'dugena' },
  { name: 'Daniel Khone', slug: 'daniel-khone' },
  { name: 'Danish Design', slug: 'danish-design' },
  { name: 'Frederique Constant', slug: 'frederique-constant' },
  { name: 'Goldpfeil', slug: 'goldpfeil' },
  { name: 'Ludwig Stahl', slug: 'ludwig-stahl' },
];

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;

  for (const b of newBrands) {
    const existing = await prisma.brand.findFirst({
      where: { OR: [{ slug: b.slug }, { name: b.name }] },
    });
    if (existing) {
      // Make sure the brand is at least tagged for the watches category so it
      // shows in the watch shop sidebar, but don't disturb anything else.
      if (!existing.categories.includes('watches')) {
        await prisma.brand.update({
          where: { id: existing.id },
          data: { categories: { push: 'watches' } },
        });
      }
      skipped += 1;
      continue;
    }
    await prisma.brand.create({
      data: { name: b.name, slug: b.slug, categories: ['watches'] },
    });
    created += 1;
  }

  const total = await prisma.brand.count({
    where: { categories: { has: 'watches' } },
  });
  console.log(
    `New watch brands → created: ${created}, already present: ${skipped}. ` +
      `Total watch brands now: ${total}.`,
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
