-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'shipped', 'delivered');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "category_type" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSecondHand" BOOLEAN NOT NULL DEFAULT false,
    "warningNotForChildrenUnder3" BOOLEAN NOT NULL DEFAULT false,
    "warningContainsButtonCell" BOOLEAN NOT NULL DEFAULT false,
    "weeeRegNumber" TEXT,
    "manufacturerInfo" TEXT,
    "responsiblePersonEU" TEXT,
    "safetyInfo" TEXT,
    "packageContents" TEXT,
    "gender" TEXT,
    "movement" TEXT,
    "caseMaterial" TEXT,
    "strapMaterial" TEXT,
    "caseColor" TEXT,
    "strapColor" TEXT,
    "dialColor" TEXT,
    "displayType" TEXT,
    "waterResistance" TEXT,
    "watchShape" TEXT,
    "caseFinish" TEXT,
    "crystalType" TEXT,
    "bezel" TEXT,
    "caseBack" TEXT,
    "dialPattern" TEXT,
    "settingAdornment" TEXT,
    "clasp" TEXT,
    "functions" TEXT[],
    "styles" TEXT[],
    "caliber" TEXT,
    "yearOfManufacture" INTEGER,
    "diameterMm" DOUBLE PRECISION,
    "caseThicknessMm" DOUBLE PRECISION,
    "lugWidthMm" DOUBLE PRECISION,
    "maxWristCircumferenceMm" DOUBLE PRECISION,
    "fitting" TEXT,
    "claspWidthMm" DOUBLE PRECISION,
    "minLengthMm" DOUBLE PRECISION,
    "maxLengthMm" DOUBLE PRECISION,
    "capacity" TEXT,
    "dimensions" TEXT,
    "bundleType" TEXT,
    "contentsSummary" TEXT,
    "weeeRegNumberBatteries" TEXT,
    "productType" TEXT,
    "shortDescription" TEXT,
    "itemName" TEXT,
    "weightGrams" DOUBLE PRECISION,
    "style" TEXT,
    "material" TEXT,
    "color" TEXT,
    "ringSizeCircumference" TEXT,
    "chainLengthMm" DOUBLE PRECISION,
    "chainWidthMm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_themes" (
    "productId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,

    CONSTRAINT "product_themes_pkey" PRIMARY KEY ("productId","themeId")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "shippingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "themes_categoryId_idx" ON "themes"("categoryId");

-- CreateIndex
CREATE INDEX "themes_slug_idx" ON "themes"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_isOnSale_idx" ON "products"("isOnSale");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_isSecondHand_idx" ON "products"("isSecondHand");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_category_type_idx" ON "products"("category_type");

-- CreateIndex
CREATE INDEX "products_category_type_movement_idx" ON "products"("category_type", "movement");

-- CreateIndex
CREATE INDEX "products_category_type_caseMaterial_idx" ON "products"("category_type", "caseMaterial");

-- CreateIndex
CREATE INDEX "products_category_type_gender_idx" ON "products"("category_type", "gender");

-- CreateIndex
CREATE INDEX "products_category_type_waterResistance_idx" ON "products"("category_type", "waterResistance");

-- CreateIndex
CREATE INDEX "products_category_type_dialColor_idx" ON "products"("category_type", "dialColor");

-- CreateIndex
CREATE INDEX "products_category_type_caseColor_idx" ON "products"("category_type", "caseColor");

-- CreateIndex
CREATE INDEX "products_category_type_strapColor_idx" ON "products"("category_type", "strapColor");

-- CreateIndex
CREATE INDEX "products_category_type_displayType_idx" ON "products"("category_type", "displayType");

-- CreateIndex
CREATE INDEX "products_category_type_clasp_idx" ON "products"("category_type", "clasp");

-- CreateIndex
CREATE INDEX "products_category_type_fitting_idx" ON "products"("category_type", "fitting");

-- CreateIndex
CREATE INDEX "products_category_type_lugWidthMm_idx" ON "products"("category_type", "lugWidthMm");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "carts_userId_idx" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "carts_sessionId_idx" ON "carts"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_email_key" ON "newsletter"("email");

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_themes" ADD CONSTRAINT "product_themes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_themes" ADD CONSTRAINT "product_themes_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
