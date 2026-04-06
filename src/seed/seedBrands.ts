import prisma from '../lib/prisma';

const brands = [
  // Watch brands
  { name: 'Alfex', slug: 'alfex', categories: ['watches'] },
  { name: 'Boss', slug: 'boss', categories: ['watches'] },
  { name: 'CAT', slug: 'cat', categories: ['watches'] },
  { name: 'Cerruti 1881', slug: 'cerruti-1881', categories: ['watches'] },
  { name: 'Elle', slug: 'elle', categories: ['watches'] },
  { name: 'ESBM', slug: 'esbm', categories: ['watches'] },
  { name: 'Gadison Stern', slug: 'gadison-stern', categories: ['watches'] },
  { name: 'GOOIX', slug: 'gooix', categories: ['watches'] },
  { name: 'Jacques Cantani', slug: 'jacques-cantani', categories: ['watches'] },
  { name: 'Jacques Lemans', slug: 'jacques-lemans', categories: ['watches'] },
  { name: 'Jaguar', slug: 'jaguar', categories: ['watches'] },
  { name: 'Jean Seville', slug: 'jean-seville', categories: ['watches'] },
  { name: 'Laco & Lacher', slug: 'laco-lacher', categories: ['watches'] },
  { name: 'Master Time', slug: 'master-time', categories: ['watches'] },
  { name: 'Mathey Tissot', slug: 'mathey-tissot', categories: ['watches'] },
  { name: 'Mido', slug: 'mido', categories: ['watches'] },
  { name: 'Mondaine', slug: 'mondaine', categories: ['watches'] },
  { name: 'Morgan & Headley', slug: 'morgan-headley', categories: ['watches'] },
  { name: 'Obaku', slug: 'obaku', categories: ['watches'] },
  { name: 'Osco', slug: 'osco', categories: ['watches'] },
  { name: 'Otto Schlund', slug: 'otto-schlund', categories: ['watches'] },
  { name: 'Pascal Hilton', slug: 'pascal-hilton', categories: ['watches'] },
  { name: 'Pierre Cardin', slug: 'pierre-cardin', categories: ['watches'] },
  { name: 'Quality Time', slug: 'quality-time', categories: ['watches'] },
  { name: 'Q&Q', slug: 'q-q', categories: ['watches'] },
  { name: 'Regent', slug: 'regent', categories: ['watches'] },
  { name: 'Revue Thommen', slug: 'revue-thommen', categories: ['watches'] },
  { name: 'Richter & Söhne', slug: 'richter-soehne', categories: ['watches'] },
  { name: 'Rivado', slug: 'rivado', categories: ['watches'] },
  { name: 'Roamer', slug: 'roamer', categories: ['watches'] },
  { name: 'Rhythm', slug: 'rhythm', categories: ['watches'] },
  { name: 'Swiss Military', slug: 'swiss-military', categories: ['watches'] },
  { name: 'Time Force', slug: 'time-force', categories: ['watches'] },
  { name: 'TP Time Piece', slug: 'tp-time-piece', categories: ['watches'] },
  { name: 'Xemex', slug: 'xemex', categories: ['watches'] },
  { name: 'Yves Bertelin', slug: 'yves-bertelin', categories: ['watches'] },
  { name: 'Zentra', slug: 'zentra', categories: ['watches'] },
  // Strap brands
  { name: 'Diloy', slug: 'diloy', categories: ['watch_straps', 'jewelry'] },
  { name: 'Various', slug: 'various', categories: ['watch_straps'] },
];

export async function seedBrands() {
  await prisma.brand.deleteMany({});
  const result = await prisma.brand.createMany({ data: brands });
  console.log(`Seeded ${result.count} brands`);
}
