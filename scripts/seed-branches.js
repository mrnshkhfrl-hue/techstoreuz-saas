const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log('No shop found');
    return;
  }
  console.log('Found shop:', shop.id, shop.name);

  const existingBranches = await prisma.branch.findMany({
    where: { shopId: shop.id },
  });

  if (existingBranches.length === 0) {
    await prisma.branch.createMany({
      data: [
        {
          shopId: shop.id,
          name: 'Филиал №1 (Главный)',
          address: 'г. Самарканд, ул. Гульабад, 1 (09:00 - 21:00)',
          phone: '+998 77 285-99-99',
        },
        {
          shopId: shop.id,
          name: 'Филиал №2 (ТЦ «Makon Mall»)',
          address: 'г. Самарканд, ТЦ «Makon Mall», 1-й этаж (10:00 - 22:00)',
          phone: '+998 77 285-99-99',
        },
      ],
    });
    console.log('Seeded 2 branches for shop:', shop.name);
  } else {
    console.log('Branches already exist:', existingBranches);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
