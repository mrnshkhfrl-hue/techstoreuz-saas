import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    // Fetch all users with their bookings and product details
    const allUsers = await prisma.user.findMany({
      where: shopId
        ? {
            OR: [
              { bookings: { some: { shopId } } },
              { ownedShops: { some: { id: shopId } } },
              { adminIn: { some: { shopId } } },
            ],
          }
        : {},
      include: {
        bookings: {
          where: shopId ? { shopId } : {},
          include: {
            usedProduct: true,
            variant: {
              include: {
                template: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const customers = allUsers.map((u) => {
      const userBookings = u.bookings || [];
      const completed = userBookings.filter((b) => b.status === "COMPLETED");
      const active = userBookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
      const cancelled = userBookings.filter((b) => b.status === "CANCELLED");

      const totalSpent = completed.reduce((sum, b) => {
        const p = b.usedProduct?.price || b.variant?.price || 0;
        return sum + p;
      }, 0);

      // Determine client tier
      let tier: "VIP" | "REGULAR" | "NEW" = "NEW";
      if (completed.length >= 2 || totalSpent >= 1500) {
        tier = "VIP";
      } else if (completed.length >= 1 || userBookings.length >= 2) {
        tier = "REGULAR";
      }

      return {
        id: u.id,
        telegramId: u.telegramId,
        name: u.name || "Без имени",
        phone: u.phone,
        photoUrl: u.photoUrl,
        isPremium: u.isPremium,
        tier,
        totalBookings: userBookings.length,
        completedPurchases: completed.length,
        activeBookings: active.length,
        cancelledBookings: cancelled.length,
        totalSpent,
        lastActivity: userBookings[0]?.createdAt || null,
        history: userBookings.map((b) => ({
          id: b.id,
          status: b.status,
          createdAt: b.createdAt,
          expiresAt: b.expiresAt,
          productTitle: b.usedProduct?.title || b.variant?.template?.title || "Товар",
          price: b.usedProduct?.price || b.variant?.price || 0,
          isUsed: Boolean(b.usedProductId || b.usedProduct),
          details: b.usedProduct
            ? `${b.usedProduct.batteryHealth}% АКБ • ${b.usedProduct.region}`
            : b.variant
            ? `${b.variant.storage} • ${b.variant.color}`
            : "",
        })),
      };
    });

    // Sort by total spent descending, then by total bookings
    customers.sort((a, b) => b.totalSpent - a.totalSpent || b.totalBookings - a.totalBookings);

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("[Customers API GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
