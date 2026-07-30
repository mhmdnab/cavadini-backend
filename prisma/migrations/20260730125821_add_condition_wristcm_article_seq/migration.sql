-- Additive: condition + conditionDetails (item 10), maxWristCircumferenceCm (item 3),
-- and a sequence backing auto-generated KO-##### article numbers (item 6).
-- New columns only; the unrelated `_keepalive` table is intentionally preserved.

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "condition" TEXT,
ADD COLUMN     "conditionDetails" TEXT,
ADD COLUMN     "maxWristCircumferenceCm" DOUBLE PRECISION;

-- Article-number sequence: atomic source for KO-00001, KO-00002, …
CREATE SEQUENCE IF NOT EXISTS "article_number_seq" START 1;
