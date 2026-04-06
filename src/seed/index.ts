import 'dotenv/config';
import prisma from '../lib/prisma';
import { seedCategories } from './seedCategories';
import { seedBrands } from './seedBrands';
import { seedThemes } from './seedThemes';

async function seed(): Promise<void> {
  console.log('Seeding...');

  const categories = await seedCategories();
  await seedBrands();
  await seedThemes(categories);

  await prisma.$disconnect();
  console.log('Seeding complete');
}

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
