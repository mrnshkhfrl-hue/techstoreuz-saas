import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/auth";

const SUPERADMIN_IDS = (
  process.env.SUPERADMIN_IDS ||
  process.env.NEXT_PUBLIC_SUPERADMIN_IDS ||
  process.env.ADMIN_CHAT_IDS ||
  "7949519588,8603067434"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAuthorized(req: Request): boolean {
  // 1. Check Telegram initData signature
  const initData = req.headers.get("x-init-data");
  if (initData) {
    const user = validateInitData(initData);
    if (user && user.id && SUPERADMIN_IDS.includes(String(user.id))) {
      return true;
    }
  }

  // 2. Check X-Admin-Id or X-Telegram-User-Id header
  const adminId = req.headers.get("x-admin-id") || req.headers.get("x-telegram-user-id");
  if (adminId && SUPERADMIN_IDS.includes(adminId.trim())) {
    return true;
  }

  // 3. Localhost dev bypass
  const host = req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return true;
  }

  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Доступ запрещен. Требуются права супер-администратора." },
      { status: 403 }
    );
  }

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
      botToken: s.tgBotToken ? s.tgBotToken.substring(0, 12) + "..." : null,
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
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Доступ запрещен. Требуются права супер-администратора." },
      { status: 403 }
    );
  }

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
      where: { telegramId: "7949519588" },
    });
    if (!owner) {
      owner = await prisma.user.findFirst();
    }
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          telegramId: "7949519588",
          name: "Mrnshkh",
          phone: "+998505775817",
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
