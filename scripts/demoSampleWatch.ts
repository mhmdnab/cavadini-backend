import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

// Temporary demo: fully populate ONE watch (Swiss Military Hanowa Patrol) across
// all 30 Technische Daten fields + the compliance block + the button-cell flag,
// so the product page shows the complete layout and the per-locale value
// translation (Task 1). All values written here target currently-EMPTY columns,
// so reverting simply clears them again — the watch's real existing values
// (name, referenceNumber, description, gender, movement, functions, caseMaterial,
// diameterMm, caseThicknessMm, waterResistance, strapMaterial, price) are NOT
// touched in either direction.
//
//   Populate:  npx ts-node scripts/demoSampleWatch.ts
//   Revert:    npx ts-node scripts/demoSampleWatch.ts --revert

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const ID = '4669b7d6-8f2f-4851-9f1d-41c92eed45f2';

// Demo values. Enum-like fields use canonical forms that exist in
// lib/valueTranslations.ts so they translate on /de and /en (Style, Uhrenform,
// Zifferblattmuster "Guilloche", materials, colours, etc.). Free-text fields
// (Kaliber, dimensions, Lieferumfang, compliance text) are shown as stored.
const DEMO = {
  articleNumber: 'SM-05519855',
  styles: ['Klassiker', 'Sport'],
  displayType: 'Analog',
  caliber: 'ETA 2824-2',
  yearOfManufacture: 2023,
  watchShape: 'Rund',
  caseColor: 'Silver',
  caseFinish: 'matt & poliert',
  crystalType: 'Saphirglas',
  bezel: 'einseitig drehbar',
  settingAdornment: 'Ohne',
  caseBack: 'Glasboden verschraubt',
  dialColor: 'Black',
  dialPattern: 'Guilloche',
  strapColor: 'Silver',
  clasp: 'Faltschliesse mit Sicherheitsbügel',
  lugWidthMm: 20,
  maxWristCircumferenceMm: 210,
  packageContents: 'Originalbox, Garantiekarte, Bedienungsanleitung',
  manufacturerInfo:
    'Swiss Military by Hanowa, Hanowa AG, Schwarzenburgstrasse 100, 3097 Liebefeld, Schweiz',
  responsiblePersonEU:
    'Cavadini GmbH, Musterstraße 1, 10115 Berlin, Deutschland — info@cavadini.example',
  safetyInfo:
    'Nicht für Kinder unter 3 Jahren geeignet. Enthält Kleinteile und eine Knopfzelle.',
  weeeRegNumber: 'DE 12345678',
  warningContainsButtonCell: true,
} satisfies Prisma.ProductUpdateInput;

// Revert clears exactly the columns DEMO sets (back to empty/false).
const REVERT = {
  articleNumber: null,
  styles: [],
  displayType: null,
  caliber: null,
  yearOfManufacture: null,
  watchShape: null,
  caseColor: null,
  caseFinish: null,
  crystalType: null,
  bezel: null,
  settingAdornment: null,
  caseBack: null,
  dialColor: null,
  dialPattern: null,
  strapColor: null,
  clasp: null,
  lugWidthMm: null,
  maxWristCircumferenceMm: null,
  packageContents: null,
  manufacturerInfo: null,
  responsiblePersonEU: null,
  safetyInfo: null,
  weeeRegNumber: null,
  warningContainsButtonCell: false,
} satisfies Prisma.ProductUpdateInput;

async function main() {
  const revert = process.argv.includes('--revert');
  const data = revert ? REVERT : DEMO;
  const updated = await prisma.product.update({ where: { id: ID }, data });
  console.log(`${revert ? 'Reverted' : 'Populated'} demo watch: ${updated.name} (${ID})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
