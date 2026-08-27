import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration to ProductVariants...");
  
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  let created = 0;

  for (const product of products) {
    if (product.variants.length === 0) {
      // Parse colors and storage to create combinations if possible
      let colors = [];
      try {
        const parsedColors = JSON.parse(product.colors);
        if (Array.isArray(parsedColors)) colors = parsedColors;
      } catch (e) {}

      let storage = [];
      try {
        const parsedStorage = JSON.parse(product.storage || '[]');
        if (Array.isArray(parsedStorage)) storage = parsedStorage;
      } catch (e) {}
      
      let models = [];
      try {
        const parsedModels = JSON.parse(product.models);
        if (Array.isArray(parsedModels)) models = parsedModels;
      } catch (e) {}

      // If no arrays are defined, just create one default variant
      if (colors.length === 0 && storage.length === 0 && models.length === 0) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            price: product.price,
            stock: product.stockCount,
            condition: product.isUsed ? "USED" : "NEW",
          }
        });
        created++;
      } else {
        // Just create one default variant representing the base product
        // Since we don't know the exact matrix they had in mind, we'll
        // assign the first of each array if available.
        // Actually, creating a full matrix might explode if they selected 5 colors and 3 storages (15 variants)
        // Let's create one default variant to preserve the current state.
        const defaultColor = colors[0]?.name || null;
        const defaultStorage = storage[0] || null;
        const defaultModel = models[0] || null;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            price: product.price,
            stock: product.stockCount,
            attributes: {
              color: defaultColor,
              memory: defaultStorage,
              model: defaultModel,
            },
            condition: product.isUsed ? "USED" : "NEW",
          }
        });
        created++;
      }
    }
  }

  console.log(`Migration completed. Created ${created} variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
