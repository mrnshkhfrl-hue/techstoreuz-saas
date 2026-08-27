-- CreateEnum
CREATE TYPE "VariantCondition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "manualCurrencyRate" DOUBLE PRECISION,
    "installmentMarkup3" INTEGER NOT NULL DEFAULT 10,
    "installmentMarkup6" INTEGER NOT NULL DEFAULT 20,
    "installmentMarkup12" INTEGER NOT NULL DEFAULT 30,
    "telegramChannelUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "botToken" TEXT,
    "botUsername" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0070c9',
    "accentColor" TEXT NOT NULL DEFAULT '#34c759',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "manualCurrencyRate" DOUBLE PRECISION,
    "contactPhone" TEXT,
    "telegramChannel" TEXT,
    "address" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'STARTER',
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "shopId" TEXT,
    "name" TEXT NOT NULL,
    "nameUz" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "oldPrice" DOUBLE PRECISION,
    "images" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "description" TEXT,
    "descriptionUz" TEXT,
    "category" TEXT NOT NULL DEFAULT 'phone',
    "categoryId" TEXT,
    "attributes" TEXT NOT NULL DEFAULT '[]',
    "colors" TEXT NOT NULL DEFAULT '[]',
    "storage" TEXT,
    "models" TEXT NOT NULL DEFAULT '[]',
    "stockCount" INTEGER NOT NULL DEFAULT 10,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "battery" INTEGER,
    "condition" INTEGER,
    "region" TEXT,
    "boxAndDocs" BOOLEAN NOT NULL DEFAULT false,
    "screenDefects" TEXT,
    "exchange" BOOLEAN NOT NULL DEFAULT false,
    "hasInstallment" BOOLEAN NOT NULL DEFAULT false,
    "deviceCondition" TEXT DEFAULT 'New',
    "uzImei" BOOLEAN NOT NULL DEFAULT false,
    "box" BOOLEAN NOT NULL DEFAULT false,
    "installmentAvailable" BOOLEAN NOT NULL DEFAULT false,
    "installmentDownPayment" DOUBLE PRECISION,
    "installment6m" DOUBLE PRECISION,
    "installment9m" DOUBLE PRECISION,
    "installment12m" DOUBLE PRECISION,
    "batteryHealth" INTEGER,
    "batteryCycles" INTEGER,
    "defects" TEXT,
    "seller" TEXT,
    "bodyMaterial" TEXT,
    "strapSize" TEXT,
    "material" TEXT,
    "compatibility" TEXT,
    "sim" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "condition" "VariantCondition" NOT NULL DEFAULT 'NEW',
    "status" "VariantStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "shopId" TEXT,
    "telegramId" TEXT NOT NULL,
    "senderTelegramId" TEXT,
    "username" TEXT,
    "fullName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "platform" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "idempotencyKey" TEXT,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'ORDER',
    "status" TEXT NOT NULL DEFAULT 'new',
    "isManualPhone" BOOLEAN NOT NULL DEFAULT false,
    "installmentMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "fullName" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "photoUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDraft" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sourceChatId" TEXT,
    "sourceMessageId" TEXT,
    "sourceText" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "images" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "marketingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInRequest" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "telegramId" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'Unknown',
    "sim" TEXT NOT NULL DEFAULT 'Unknown',
    "hasBox" BOOLEAN NOT NULL DEFAULT false,
    "batteryHealth" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "estimatedPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInSku" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "modelName" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInPenalty" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "category" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "penaltyType" TEXT NOT NULL DEFAULT 'FIXED',
    "penaltyValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_botToken_key" ON "Shop"("botToken");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_botUsername_key" ON "Shop"("botUsername");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_telegramId_key" ON "Admin"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_telegramId_key" ON "UserSettings"("telegramId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInRequest" ADD CONSTRAINT "TradeInRequest_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInSku" ADD CONSTRAINT "TradeInSku_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInPenalty" ADD CONSTRAINT "TradeInPenalty_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

