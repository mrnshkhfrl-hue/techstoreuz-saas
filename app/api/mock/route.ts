import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Очищаем старые данные (каскадно удалит Shop → Products → Variants, Bookings)
    await prisma.booking.deleteMany();
    await prisma.usedProduct.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.newProductTemplate.deleteMany();
    await prisma.shopAdmin.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();

    // 2. Тестовый пользователь (Владелец)
    const user = await prisma.user.create({
      data: {
        telegramId: "123456789",
        name: "Test Admin",
        isPremium: true,
      },
    });

    // 3. Магазин
    const shop = await prisma.shop.create({
      data: {
        name: "Tech Bozor Tashkent",
        tgBotToken: "test_bot_token_123",
        currencyRate: 12800,
        ownerId: user.id,
      },
    });

    // 4. Новые товары (4 шт.)
    await prisma.newProductTemplate.create({
      data: {
        title: "iPhone 16 Pro Max",
        basePrice: 1420,
        shopId: shop.id,
        variants: {
          create: [
            { color: "Black Titanium", storage: "256GB", simType: "eSIM", price: 1420, stock: 8 },
            { color: "Natural Titanium", storage: "512GB", simType: "eSIM", price: 1620, stock: 3 },
            { color: "White Titanium", storage: "1TB", simType: "Dual SIM", price: 1920, stock: 1 },
          ],
        },
      },
    });

    await prisma.newProductTemplate.create({
      data: {
        title: "iPhone 16 Pro",
        basePrice: 1200,
        shopId: shop.id,
        variants: {
          create: [
            { color: "Black Titanium", storage: "128GB", simType: "eSIM", price: 1200, stock: 12 },
            { color: "Desert Titanium", storage: "256GB", simType: "eSIM", price: 1350, stock: 5 },
          ],
        },
      },
    });

    await prisma.newProductTemplate.create({
      data: {
        title: "Samsung S25 Ultra",
        basePrice: 1300,
        shopId: shop.id,
        variants: {
          create: [
            { color: "Titanium Black", storage: "256GB", simType: "Dual SIM", price: 1300, stock: 6 },
            { color: "Titanium Gray", storage: "512GB", simType: "Dual SIM", price: 1500, stock: 4 },
            { color: "Titanium Blue", storage: "1TB", simType: "Dual SIM", price: 1800, stock: 2 },
          ],
        },
      },
    });

    await prisma.newProductTemplate.create({
      data: {
        title: "Google Pixel 9 Pro",
        basePrice: 1050,
        shopId: shop.id,
        variants: {
          create: [
            { color: "Obsidian", storage: "128GB", simType: "eSIM", price: 1050, stock: 7 },
            { color: "Porcelain", storage: "256GB", simType: "eSIM", price: 1200, stock: 3 },
          ],
        },
      },
    });

    // 5. Б/У товары (4 шт.)
    await prisma.usedProduct.create({
      data: {
        title: "iPhone 15 Pro",
        batteryHealth: 87,
        region: "LL/A",
        hasBox: true,
        defects: "Мелкая царапина на экране",
        price: 850,
        status: "AVAILABLE",
        shopId: shop.id,
      },
    });

    await prisma.usedProduct.create({
      data: {
        title: "iPhone 14 Pro Max",
        batteryHealth: 92,
        region: "ZP/A",
        hasBox: true,
        defects: null,
        price: 720,
        status: "AVAILABLE",
        shopId: shop.id,
      },
    });

    await prisma.usedProduct.create({
      data: {
        title: "Samsung S24 Ultra",
        batteryHealth: 95,
        region: "Korea",
        hasBox: false,
        defects: "Потёртости на корпусе",
        price: 680,
        status: "AVAILABLE",
        shopId: shop.id,
      },
    });

    await prisma.usedProduct.create({
      data: {
        title: "iPhone 13 Pro",
        batteryHealth: 79,
        region: "LL/A",
        hasBox: false,
        defects: null,
        price: 480,
        status: "BOOKED",
        shopId: shop.id,
      },
    });

    return NextResponse.json({
      success: true,
      shopId: shop.id,
      message: "Seed завершён: 4 новых, 4 б/у товара, 1 магазин.",
    });
  } catch (error) {
    console.error("Error creating mock data:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
