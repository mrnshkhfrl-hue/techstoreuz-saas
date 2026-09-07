import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, title, batteryHealth, region, hasBox, defects, price, images } = body;

    if (!shopId || !title || price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json(
        { error: "Необходимые поля: shopId, title, price (число)" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: "Магазин не найден" }, { status: 404 });
    }

    const newProduct = await prisma.usedProduct.create({
      data: {
        shopId,
        title: String(title).trim(),
        batteryHealth: Number(batteryHealth) || 100,
        region: String(region || "LL/A").trim(),
        hasBox: Boolean(hasBox),
        defects: defects ? String(defects).trim() : null,
        images: images || null,
        price: Number(price),
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Error creating used product:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось создать Б/У товар" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, price, batteryHealth, region, hasBox, defects, title } = body;

    if (!id) {
      return NextResponse.json({ error: "ID товара обязателен" }, { status: 400 });
    }

    const validStatuses = ["AVAILABLE", "BOOKED", "SOLD_ONLINE", "SOLD_OFFLINE"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Неверный статус товара" }, { status: 400 });
    }

    const updated = await prisma.usedProduct.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(price !== undefined && !isNaN(Number(price)) ? { price: Number(price) } : {}),
        ...(batteryHealth !== undefined && !isNaN(Number(batteryHealth)) ? { batteryHealth: Number(batteryHealth) } : {}),
        ...(region ? { region: String(region).trim() } : {}),
        ...(hasBox !== undefined ? { hasBox: Boolean(hasBox) } : {}),
        ...(defects !== undefined ? { defects: defects ? String(defects).trim() : null } : {}),
        ...(title ? { title: String(title).trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Error updating used product:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось обновить товар" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID товара обязателен" }, { status: 400 });
    }

    await prisma.usedProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting used product:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось удалить товар" },
      { status: 500 }
    );
  }
}
