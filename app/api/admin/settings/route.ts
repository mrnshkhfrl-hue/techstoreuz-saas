import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst({
      select: {
        currencyRate: true,
        name: true,
        tgLink: true,
        instaLink: true,
        aboutText: true,
      },
    });

    const manualCurrencyRate = shop?.currencyRate || Number(process.env.NEXT_PUBLIC_USD_TO_UZS_RATE) || 12800;

    return NextResponse.json({
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
