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
