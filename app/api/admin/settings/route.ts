import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst({
      select: {
        id: true,
        currencyRate: true,
        name: true,
        tgLink: true,
        instaLink: true,
        aboutText: true,
      },
    });

    const manualCurrencyRate = shop?.currencyRate || Number(process.env.NEXT_PUBLIC_USD_TO_UZS_RATE) || 12800;

    return NextResponse.json({
      id: shop?.id,
      manualCurrencyRate,
      currencyRate: manualCurrencyRate,
      installmentMarkup3: 10,
      installmentMarkup6: 20,
      installmentMarkup12: 30,
      shopName: shop?.name || process.env.NEXT_PUBLIC_STORE_NAME || "Techstoreuz",
      tgLink: shop?.tgLink || null,
      instaLink: shop?.instaLink || null,
      aboutText: shop?.aboutText || null,
    });
  } catch (error: any) {
    console.error("[AdminSettings] Error:", error);
    return NextResponse.json({
      manualCurrencyRate: Number(process.env.NEXT_PUBLIC_USD_TO_UZS_RATE) || 12800,
      installmentMarkup3: 10,
      installmentMarkup6: 20,
      installmentMarkup12: 30,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, currencyRate, aboutText, name, tgLink, instaLink } = body;

    const shop = shopId
      ? await prisma.shop.findUnique({ where: { id: shopId } })
      : await prisma.shop.findFirst();

    if (!shop) {
      return NextResponse.json({ error: "Магазин не найден" }, { status: 404 });
    }

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(currencyRate !== undefined && !isNaN(Number(currencyRate)) ? { currencyRate: Number(currencyRate) } : {}),
        ...(aboutText !== undefined ? { aboutText: String(aboutText).trim() } : {}),
        ...(name ? { name: String(name).trim() } : {}),
        ...(tgLink !== undefined ? { tgLink: tgLink ? String(tgLink).trim() : null } : {}),
        ...(instaLink !== undefined ? { instaLink: instaLink ? String(instaLink).trim() : null } : {}),
      },
    });

    return NextResponse.json({ success: true, shop: updated });
  } catch (error: any) {
    console.error("[AdminSettings POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
