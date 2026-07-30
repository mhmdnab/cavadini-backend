/**
 * One-time, ADDITIVE data backfill for items 3 + 10. Populates the new columns
 * from existing data WITHOUT touching the source columns:
 *
 *   item 3 — maxWristCircumferenceCm  ← maxWristCircumferenceMm / 10
 *   item 10 — condition               ← isSecondHand ? "Gebraucht" : (left null)
 *
 * Existing `maxWristCircumferenceMm` and `isSecondHand` are preserved as
 * fallbacks. Idempotent: only fills rows where the new column is still null.
 *
 * ⚠️ Not run automatically. Steve to confirm before running against prod:
 *   npx dotenv -e .env -- ts-node scripts/backfillWristCmAndCondition.ts        (prod)
 *   npx dotenv -e .env.development -- ts-node scripts/backfillWristCmAndCondition.ts  (local)
 */
import prisma from '../src/lib/prisma';

async function main() {
  // Item 3: mm → cm (only where cm not already set and mm present).
  const wristRows = await prisma.product.findMany({
    where: { maxWristCircumferenceCm: null, maxWristCircumferenceMm: { not: null } },
    select: { id: true, maxWristCircumferenceMm: true },
  });
  let cmUpdated = 0;
  for (const r of wristRows) {
    const mm = r.maxWristCircumferenceMm!;
    // Legacy data is inconsistent: most rows hold genuine mm (170–225), but a
    // few hold the cm value directly (e.g. 21.5). Values >= 100 are mm (÷10);
    // anything smaller is already cm and kept as-is.
    const cm = mm >= 100 ? Number((mm / 10).toFixed(2)) : mm;
    await prisma.product.update({ where: { id: r.id }, data: { maxWristCircumferenceCm: cm } });
    cmUpdated++;
  }

  // Item 10: used → "Gebraucht". New/NOS is left null for the admin to set,
  // since most stock is NOS and we must not mislabel it as "Neu".
  const condResult = await prisma.product.updateMany({
    where: { condition: null, isSecondHand: true },
    data: { condition: 'Gebraucht' },
  });

  console.log(`item 3: set maxWristCircumferenceCm on ${cmUpdated} products`);
  console.log(`item 10: set condition="Gebraucht" on ${condResult.count} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
