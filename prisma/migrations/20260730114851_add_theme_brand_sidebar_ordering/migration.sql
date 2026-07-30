-- Additive sidebar ordering + visibility for THEMEN (themes) and MARKEN (brands).
-- New columns only, all with safe defaults; no drops/renames. The unrelated
-- `_keepalive` table that Prisma's diff wanted to drop is intentionally left in place.

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "themes" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "themes_categoryId_sortOrder_idx" ON "themes"("categoryId", "sortOrder");
