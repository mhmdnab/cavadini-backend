-- AlterTable: add bilingual EN sibling columns to products
ALTER TABLE "products" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "products" ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "products" ADD COLUMN "manufacturerInfoEn" TEXT;
ALTER TABLE "products" ADD COLUMN "responsiblePersonEUEn" TEXT;
ALTER TABLE "products" ADD COLUMN "safetyInfoEn" TEXT;
ALTER TABLE "products" ADD COLUMN "packageContentsEn" TEXT;
ALTER TABLE "products" ADD COLUMN "shortDescriptionEn" TEXT;
ALTER TABLE "products" ADD COLUMN "itemNameEn" TEXT;

-- AlterTable: add nameEn to categories
ALTER TABLE "categories" ADD COLUMN "nameEn" TEXT;

-- AlterTable: add nameEn to themes
ALTER TABLE "themes" ADD COLUMN "nameEn" TEXT;
