import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        _count: {
          select: {
            newProducts: true,
            usedProducts: true,
            bookings: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.id.slice(0, 8),
      botToken: s.tgBotToken,
      botUsername: s.tgLink || "",
      createdAt: new Date().toISOString(),
      _count: {
        products: s._count.newProducts + s._count.usedProducts,
        orders: s._count.bookings,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("[SuperAdminShops GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, botToken, botUsername } = body;

    if (!name || !botToken) {
      return NextResponse.json(
        { error: "Название и Bot Token обязательны" },
        { status: 400 }
      );
    }

    // Find or create default owner
    let owner = await prisma.user.findFirst({
      where: { telegramId: "system_root" },
    });
    if (!owner) {
      owner = await prisma.user.findFirst();
    }
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          telegramId: "system_root",
          name: "Platform Owner",
          phone: "+998900000000",
        },
      });
    }

    const newShop = await prisma.shop.create({
      data: {
        name,
        tgBotToken: botToken.trim(),
        tgLink: botUsername ? `https://t.me/${botUsername.replace(/^@/, "")}` : null,
        ownerId: owner.id,
      },
    });

    return NextResponse.json({ success: true, shop: newShop });
  } catch (error: any) {
    console.error("[SuperAdminShops POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
