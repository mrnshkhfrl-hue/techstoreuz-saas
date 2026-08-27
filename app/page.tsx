import { prisma } from "@/lib/prisma";
import StorefrontClient from "@/components/StorefrontClient";
import RootRouter from "@/components/RootRouter";

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const shopId = Array.isArray(resolvedSearchParams?.shopId)
    ? resolvedSearchParams.shopId[0]
    : resolvedSearchParams?.shopId;

  if (shopId) {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          newProducts: {
            include: { variants: true },
          },
          usedProducts: true,
        },
      });

      if (shop) {
        const serializedShop = JSON.parse(JSON.stringify(shop));
        return <StorefrontClient shop={serializedShop} />;
      }
    } catch (error) {
      console.error("[RootPage] Shop lookup error:", error);
    }
  }

  // If no shopId provided or shop is not found, render smart RootRouter with Telegram Owner check
  return <RootRouter />;
}
