import { prisma } from "./prisma";

export async function getCurrentExchangeRate(shopId?: string): Promise<number> {
  try {
    // 1. Check Shop's currencyRate if shopId is provided
    if (shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { currencyRate: true }
      });
      if (shop?.currencyRate) {
        return shop.currencyRate;
      }
    }

    // 2. Fetch from CBU using Next.js ISR (Revalidate every 1 hour)
    const response = await fetch("https://cbu.uz/ru/arkhiv-kursov-valyut/json/", {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CBU rates: ${response.statusText}`);
    }
    
    const data = await response.json();
    const usdRateObj = data.find((item: any) => item.Ccy === "USD");
    
    if (usdRateObj && usdRateObj.Rate) {
      const rate = parseFloat(usdRateObj.Rate);
      if (!isNaN(rate)) {
        return rate;
      }
    }
    
    // Fallback if parsing fails
    return 12700;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback to hardcoded default
    return 12700;
  }
}
