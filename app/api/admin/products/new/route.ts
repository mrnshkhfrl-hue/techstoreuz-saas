import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, title, basePrice, variants, images } = body;

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
        images: images ? (typeof images === "string" ? images : JSON.stringify(images)) : null,
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { templateId, variantId, stock, price, title, basePrice } = body;

    // 1. If variantId is given, update variant stock or price
    if (variantId) {
      const updatedVariant = await prisma.productVariant.update({
        where: { id: variantId },
        data: {
          ...(stock !== undefined && !isNaN(Number(stock)) ? { stock: Number(stock) } : {}),
          ...(price !== undefined && !isNaN(Number(price)) ? { price: Number(price) } : {}),
        },
      });
      return NextResponse.json({ success: true, variant: updatedVariant });
    }

    // 2. If templateId is given, update template info
    if (templateId) {
      const updatedTemplate = await prisma.newProductTemplate.update({
        where: { id: templateId },
        data: {
          ...(title ? { title: String(title).trim() } : {}),
          ...(basePrice !== undefined && !isNaN(Number(basePrice)) ? { basePrice: Number(basePrice) } : {}),
        },
        include: { variants: true },
      });
      return NextResponse.json({ success: true, template: updatedTemplate });
    }

    return NextResponse.json({ error: "Укажите templateId или variantId" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating new product:", error);
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
      return NextResponse.json({ error: "ID шаблона обязателен" }, { status: 400 });
    }

    await prisma.newProductTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting new product template:", error);
    return NextResponse.json(
      { error: error?.message || "Не удалось удалить товар" },
      { status: 500 }
    );
  }
}
