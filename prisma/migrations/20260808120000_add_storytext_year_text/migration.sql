-- Additive + safe. NOTE: the `DROP TABLE "_keepalive"` that `prisma migrate diff`
-- generates is intentionally EXCLUDED — that table is the Supabase anti-pause
-- keepalive and must not be dropped.

-- Item 12: long-form story-telling / history text (bilingual, optional).
ALTER TABLE "products" ADD COLUMN "storyText" TEXT,
ADD COLUMN "storyTextEn" TEXT;

-- Item 7: Herstellungsjahr becomes free text (e.g. "1990 - 1999").
-- The explicit ::text cast preserves every existing integer value ("2011" etc.),
-- so no data is lost.
ALTER TABLE "products"
ALTER COLUMN "yearOfManufacture" SET DATA TYPE TEXT USING "yearOfManufacture"::text;
