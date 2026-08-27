import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, title, basePrice, variants } = body;

    if (!shopId || !title || basePrice === undefined || basePrice === null || isNaN(Number(basePrice))) {
      return NextResponse.json(
        { error: "Необходимые поля: shopId, title, basePrice (число)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "Добавьте хотя бы одну вариацию (память, цвет, SIM)" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: "Магазин не найден" }, { status: 404 });
    }

    const newTemplate = await prisma.newProductTemplate.create({
      data: {
        shopId,
        title: String(title).trim(),
        basePrice: Number(basePrice),
        variants: {
          create: variants.map((v: any) => ({
            color: String(v.color || "Space Black").trim(),
            storage: String(v.storage || "128GB").trim(),
            simType: String(v.simType || "eSIM").trim(),
            price: Number(v.price ?? basePrice),
            stock: Number(v.stock ?? 10),
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error: any) {
    console.error("Error creating new product template:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось создать товар с вариациями" },
      { status: 500 }
    );
  }
}
