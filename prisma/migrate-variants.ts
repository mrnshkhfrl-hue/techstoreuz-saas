import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeParseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Phase 2 migration: Product → ProductVariant\n');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to process.\n`);

  let variantsCreated = 0;
  let orderItemsLinked = 0;

  for (const product of products) {
    const attributes: Record<string, any> = {};

    const colors = safeParseJsonArray(product.colors);
    if (colors.length > 0) attributes.colors = colors;

    const storage = safeParseJsonArray(product.storage);
    if (storage.length > 0) attributes.storage = storage;

    const models = safeParseJsonArray(product.models);
    if (models.length > 0) attributes.models = models;

    if (product.region) attributes.region = product.region;
    if (product.battery) attributes.battery = product.battery;
    if (product.batteryHealth) attributes.batteryHealth = product.batteryHealth;
    if (product.batteryCycles) attributes.batteryCycles = product.batteryCycles;
    if (product.bodyMaterial) attributes.bodyMaterial = product.bodyMaterial;
    if (product.strapSize) attributes.strapSize = product.strapSize;
    if (product.material) attributes.material = product.material;
    if (product.compatibility) attributes.compatibility = product.compatibility;
    if (product.defects) attributes.defects = product.defects;
    if (product.screenDefects) attributes.screenDefects = product.screenDefects;

    const condition = product.isUsed ? 'USED' : 'NEW';

    // Check if variant already exists to make script idempotent
    let variant = await prisma.productVariant.findFirst({
      where: { productId: product.id }
    });

    if (!variant) {
      variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          price: product.price,
          stock: product.stockCount,
          condition: condition,
          status: 'AVAILABLE',
          attributes: attributes,
        },
      });
      variantsCreated++;
      console.log(`  ✅ Product #${product.id} "${product.name}" → Created Variant #${variant.id} (SKU: ${variant.sku})`);
    } else {
      console.log(`  ℹ️ Product #${product.id} "${product.name}" already has Variant #${variant.id}`);
    }

    // Link OrderItem using raw SQL to bypass TypeScript checking
    // since the new Prisma client might already require variantId and we might be linking old unlinked ones.
    const result = await prisma.$executeRaw`
      UPDATE "OrderItem"
      SET "variantId" = ${variant.id}
      WHERE "productId" = ${product.id} 
      AND ("variantId" IS NULL OR "variantId" = 0)
    `;

    if (result > 0) {
      orderItemsLinked += result;
      console.log(`     ↳ Linked ${result} OrderItem(s)`);
    }
  }

  // Verification using raw SQL
  const orphaned: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "OrderItem" WHERE "variantId" IS NULL OR "variantId" = 0
  `;
  const orphanedCount = Number(orphaned[0]?.count || 0);

  console.log('\n─────────────────────────────────');
  console.log('📊 Migration Summary:');
  console.log(`   Variants created:    ${variantsCreated}`);
  console.log(`   OrderItems linked:   ${orderItemsLinked}`);
  console.log(`   Orphaned OrderItems: ${orphanedCount}`);
  console.log('─────────────────────────────────');

  if (orphanedCount > 0) {
    console.log('\n⚠️  WARNING: There are still OrderItems without a variantId!');
  } else {
    console.log('\n✅ All OrderItems are linked. Safe to apply the breaking schema migration.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
