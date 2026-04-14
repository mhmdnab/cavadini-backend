import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const BUCKET_NAME = 'products';

interface ItemMapping {
  ebayItem: string;
  ref: string | null;
}

const ITEM_MAP: ItemMapping[] = [
  { ebayItem: "305768610577", ref: "CV-1606" },
  { ebayItem: "306648202831", ref: "CV-1604T" },
  { ebayItem: "365650908176", ref: "CV-1000" },
  { ebayItem: "366020262004", ref: "CV-330JN" },
  { ebayItem: "305567500615", ref: "CV-12K150" },
  { ebayItem: "306280516186", ref: null },
  { ebayItem: "364416551405", ref: "CV-4305" },
  { ebayItem: "304435058829", ref: "CV-4302" },
  { ebayItem: "362035476927", ref: "CV-745" },
  { ebayItem: "363577341747", ref: "Z-28372-2" },
  { ebayItem: "303965330595", ref: "23019" },
  { ebayItem: "363592526480", ref: "ES103581004" },
  { ebayItem: "304265713173", ref: "8948" },
  { ebayItem: "364721972278", ref: "FA0783-43" },
  { ebayItem: "365332470831", ref: "GS-230" },
  { ebayItem: "304785359089", ref: "5030" },
  { ebayItem: "303893186938", ref: "JC-890" },
  { ebayItem: "361980412328", ref: "JC-1050" },
  { ebayItem: "363636076623", ref: "JC-881" },
  { ebayItem: "363870707472", ref: "JL-813" },
  { ebayItem: "306694877000", ref: "JL-791" },
  { ebayItem: "362642927297", ref: "J-288/2" },
  { ebayItem: "366302579143", ref: null },
  { ebayItem: "365283747897", ref: "Ref. 0262" },
  { ebayItem: "304336571241", ref: "RZK-067-9" },
  { ebayItem: "362559477873", ref: "11304" },
  { ebayItem: "304014256318", ref: "A660.30122.xxEM" },
  { ebayItem: "305162505664", ref: "MH-990" },
  { ebayItem: "302732018764", ref: "MH-520" },
  { ebayItem: "363669836896", ref: "V130LGGMG" },
  { ebayItem: "306498266952", ref: "PC106032F10" },
  { ebayItem: "303601443462", ref: "QLS-30405-11M" },
  { ebayItem: "306352867853", ref: "MDV2-302" },
  { ebayItem: "306418361824", ref: "SDC" },
  { ebayItem: "306519399485", ref: "6510005" },
  { ebayItem: "305606484836", ref: "1032044" },
  { ebayItem: "364820068272", ref: "RIGS-30341-52M" },
  { ebayItem: "364089617981", ref: "619953" },
  { ebayItem: "304431378261", ref: "22400.02" },
  { ebayItem: "304490463945", ref: "MULA-91317-60M" },
  { ebayItem: "364097129739", ref: "80125" },
  { ebayItem: "363571669403", ref: "MTLS-10325" },
  { ebayItem: "365993067748", ref: "GW-12127-32" },
  { ebayItem: "365574928977", ref: "ELS-11269-21M" },
  { ebayItem: "364677918328", ref: "CRA074C2731" },
  { ebayItem: "306307722714", ref: "UE-30-5" },
  { ebayItem: "306396274364", ref: "BR20994" },
  { ebayItem: "306693030160", ref: "05-5198.55" },
  { ebayItem: "365887736960", ref: "CV-4837-7040" },
  { ebayItem: "302742205660", ref: "CV-1301-6497" },
];

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'products');

function getImageFiles(ebayItem: string): string[] {
  const folderPath = path.join(IMAGES_DIR, ebayItem);

  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs.readdirSync(folderPath)
    .filter((f) => /\.(jpe?g|png|gif|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D+/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D+/g, ''), 10) || 0;
      return numA - numB;
    });
}

function getContentType(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'gif') return 'image/gif';
  if (e === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function uploadToSupabase(
  localPath: string,
  productId: string,
  fileName: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const ext = fileName.split('.').pop() || 'jpg';
  const contentType = getContentType(ext);

  const supabasePath = `products/${productId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(supabasePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(supabasePath);

  return urlData.publicUrl;
}

interface ScraperEntry {
  status: string;
  itemNumber: string;
  name: string;
  images: string[];
}

interface ScraperReport {
  success: ScraperEntry[];
  failed?: ScraperEntry[];
}

function loadScraperNames(): Map<string, string> {
  const reportPath = path.join(__dirname, 'imageScraperReport.json');
  const nameMap = new Map<string, string>();

  if (!fs.existsSync(reportPath)) {
    return nameMap;
  }

  const report: ScraperReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  for (const entry of report.success ?? []) {
    nameMap.set(entry.itemNumber, entry.name);
  }
  return nameMap;
}

async function ensureBucket(): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });
    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }
    console.log(`✅ Created bucket "${BUCKET_NAME}"`);
  } else {
    console.log(`ℹ Bucket "${BUCKET_NAME}" already exists`);
  }
}

async function main(): Promise<void> {
  console.log('Starting image migration to Supabase...\n');

  await ensureBucket();

  const scraperNames = loadScraperNames();
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const { ebayItem, ref } of ITEM_MAP) {
    const files = getImageFiles(ebayItem);

    if (files.length === 0) {
      console.log(`⚠  NO IMAGES: eBay ${ebayItem} — no image folder found, skipping`);
      skipped++;
      continue;
    }

    try {
      let product: { id: string; name: string; images: string[] } | null = null;

      if (ref !== null) {
        product = await prisma.product.findFirst({
          where: { referenceNumber: ref },
          select: { id: true, name: true, images: true },
        });
      } else {
        const scraperName = scraperNames.get(ebayItem);
        if (scraperName) {
          const words = scraperName.split(/\s+/).filter((w) => w.length > 2);
          const searchTerm = words.slice(0, 2).join(' ');

          product = await prisma.product.findFirst({
            where: { name: { contains: searchTerm, mode: 'insensitive' } },
            select: { id: true, name: true, images: true },
          });
        }

        if (!product) {
          console.log(`⚠  NOT FOUND: eBay ${ebayItem} (ref=null, no name match) — skipping`);
          skipped++;
          continue;
        }
      }

      if (!product) {
        console.log(`⚠  NOT FOUND: eBay ${ebayItem}, ref=${ref} — no matching product in DB`);
        skipped++;
        continue;
      }

      const urls: string[] = [];
      for (const file of files) {
        const localPath = path.join(IMAGES_DIR, ebayItem, file);
        const url = await uploadToSupabase(localPath, product.id, file);
        urls.push(url);
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { images: urls },
      });

      console.log(`✅ UPDATED: ${product.name} — ${urls.length} image(s)`);
      updated++;
    } catch (err) {
      console.error(`❌ FAILED: eBay ${ebayItem}, ref=${ref} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());