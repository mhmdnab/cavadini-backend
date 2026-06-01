import { Category } from '@prisma/client';
import prisma from '../lib/prisma';

interface ThemesByCategorySlug {
  [slug: string]: string[];
}

const themesByCategory: ThemesByCategorySlug = {
  // German theme names — mirror the storefront sidebar (config/sidebar.ts).
  // A product may be assigned up to 3 of these via the ProductTheme junction.
  watches: [
    'Alle Damenuhren',
    'Alle Herrenuhren',
    'Automatikuhren',
    'Bahnhofuhren',
    'Chronographen',
    'Digitaluhren',
    'elegante Uhren',
    'Ethno-Style / Folklore',
    'Fliegeruhren',
    'Fundgrube',
    'Funk-Solaruhren',
    'Funkuhren',
    'Golduhren',
    'GPS-Uhren',
    'Handaufzugsuhren',
    'Holzuhren',
    'Kalender-Uhren',
    'Keramikuhren',
    'Kinderuhren',
    'Kinetik-Uhren',
    'klassische Uhren',
    'Lederbanduhren',
    'Schmuckuhren',
    'Schweizer Uhren',
    'Second Hand',
    'Skelettierte Uhren',
    'Solaruhren',
    'Taschenuhren',
    'Taucheruhren',
    'Tischuhren',
    'Titanuhren',
    'Uhren mit Edelsteinen',
    'Vintage',
    'XXL-Uhren',
    'Zeitlos-Schlichte Uhren',
    'Zugbanduhren',
  ],
  watch_straps: [
    '8mm',
    '10mm',
    '12mm',
    '14mm',
    '16mm',
    '18mm',
    '20mm',
    '32mm',
    '34mm',
    '11-13-15-17mm (odd sizes)',
    '19-21-23-25mm (odd sizes)',
    'Special Fitting',
    'Curved Fitting',
  ],
  bundles: [
    'Leather Straps',
    'Metal Bracelets',
    'Boxes',
    'Watches',
  ],
  watch_boxes: [
    'Single Box',
    'Collection Box',
    'Cases/Pouches',
    'Bundle Offers',
    'Trays',
    'Display',
    'Furniture',
  ],
  workshop: [
    'Tools',
    'Spare Parts',
    'Movements',
    'Batteries',
    'Bundle Offers',
  ],
  jewelry: [
    'Necklaces',
    'Pendants',
    'Bracelets',
    'Charms',
    'Earrings',
    'Rings',
    "Men's Jewelry",
  ],
  // sale: no themes — the sale flag lives on the product itself
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function seedThemes(categories: Category[]) {
  await prisma.theme.deleteMany({});

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));
  const themes: { name: string; slug: string; categoryId: string }[] = [];

  for (const [catSlug, names] of Object.entries(themesByCategory)) {
    const catId = catMap.get(catSlug);
    if (!catId) continue;
    for (const name of names) {
      themes.push({ name, slug: slugify(name), categoryId: catId });
    }
  }

  const result = await prisma.theme.createMany({ data: themes });
  console.log(`Seeded ${result.count} themes`);
}
