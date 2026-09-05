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

  try {
    const shop = shopId
      ? await prisma.shop.findUnique({
          where: { id: shopId },
          include: {
            newProducts: {
              include: { variants: true },
            },
            usedProducts: true,
          },
        })
      : await prisma.shop.findFirst({
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

  // If no shop found, render smart RootRouter with Telegram Owner check
  return <RootRouter />;
}
