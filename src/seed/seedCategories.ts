import prisma from '../lib/prisma';

const categories = [
  { name: 'Watches', slug: 'watches' },
  { name: 'Watch Straps', slug: 'watch_straps' },
  { name: 'Bundles', slug: 'bundles' },
  { name: 'Watch Boxes', slug: 'watch_boxes' },
  { name: 'Workshop', slug: 'workshop' },
  { name: 'Jewelry', slug: 'jewelry' },
  { name: 'Sale', slug: 'sale' },
];

export async function seedCategories() {
  await prisma.category.deleteMany({});
  const created = await Promise.all(
    categories.map((c) => prisma.category.create({ data: c }))
  );
  console.log(`Seeded ${created.length} categories`);
  return created;
}
