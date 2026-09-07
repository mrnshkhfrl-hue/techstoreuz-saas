import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SUPERADMIN_IDS = ["7949519588"];

async function verifyShopOwnerOrSuperadmin(shopId: string, adminId: string) {
  if (!shopId || !adminId) return null;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: true,
      admins: { include: { user: true } },
    },
  });

  if (!shop) return null;

  const isSuper = SUPERADMIN_IDS.includes(adminId.trim());
  const isOwner = shop.owner?.telegramId === adminId.trim();

  if (!isSuper && !isOwner) {
    return null;
  }

  return shop;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const adminId = searchParams.get("adminId");

    if (!shopId || !adminId) {
      return NextResponse.json({ error: "Missing shopId or adminId" }, { status: 400 });
    }

    const shop = await verifyShopOwnerOrSuperadmin(shopId, adminId);
    if (!shop) {
      return NextResponse.json({ error: "Доступ запрещен. Только владелец магазина может управлять командой." }, { status: 403 });
    }

    return NextResponse.json({
      owner: shop.owner,
      admins: shop.admins,
    });
  } catch (error: any) {
    console.error("[Staff GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, adminId, targetTelegramId, targetName, targetPhone, role } = body;

    if (!shopId || !adminId || !targetTelegramId) {
      return NextResponse.json(
        { error: "shopId, adminId и Telegram ID нового администратора обязательны" },
        { status: 400 }
      );
    }

    const cleanTargetTgId = String(targetTelegramId).trim();

    const shop = await verifyShopOwnerOrSuperadmin(shopId, adminId);
    if (!shop) {
      return NextResponse.json(
        { error: "Доступ запрещен. Только владелец магазина может добавлять администраторов." },
        { status: 403 }
      );
    }

    // Upsert target user
    const targetUser = await prisma.user.upsert({
      where: { telegramId: cleanTargetTgId },
      update: {
        ...(targetName ? { name: targetName.trim() } : {}),
        ...(targetPhone ? { phone: targetPhone.trim() } : {}),
      },
      create: {
        telegramId: cleanTargetTgId,
        name: targetName?.trim() || "Сотрудник магазина",
        phone: targetPhone?.trim() || null,
      },
    });

    // Check if already in shop.admins
    const existing = await prisma.shopAdmin.findFirst({
      where: {
        shopId: shop.id,
        userId: targetUser.id,
      },
    });

    if (existing) {
      const updated = await prisma.shopAdmin.update({
        where: { id: existing.id },
        data: { role: role === "OWNER" ? "OWNER" : "MANAGER" },
        include: { user: true },
      });
      return NextResponse.json({ success: true, admin: updated });
    }

    const newAdmin = await prisma.shopAdmin.create({
      data: {
        shopId: shop.id,
        userId: targetUser.id,
        role: role === "OWNER" ? "OWNER" : "MANAGER",
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error: any) {
    console.error("[Staff POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const adminId = searchParams.get("adminId");
    const staffId = searchParams.get("staffId");

    if (!shopId || !adminId || !staffId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const shop = await verifyShopOwnerOrSuperadmin(shopId, adminId);
    if (!shop) {
      return NextResponse.json(
        { error: "Доступ запрещен. Только владелец магазина может удалять администраторов." },
        { status: 403 }
      );
    }

    await prisma.shopAdmin.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Staff DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
