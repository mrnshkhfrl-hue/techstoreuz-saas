import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, telegramId, phone, items } = body;

    if (!shopId || !telegramId || !phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: shopId, telegramId, phone, items" },
        { status: 400 }
      );
    }

    // 1. Upsert User by telegramId
    const user = await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: { phone: String(phone) },
      create: { telegramId: String(telegramId), phone: String(phone) },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 2. Create Bookings in transaction
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === "USED") {
          const usedExists = await tx.usedProduct.findUnique({
            where: { id: String(item.id) },
          });

          await tx.booking.create({
            data: {
              shopId,
              userId: user.id,
              usedProductId: usedExists ? item.id : null,
              expiresAt,
              status: "PENDING",
            },
          });

          if (usedExists) {
            await tx.usedProduct.update({
              where: { id: item.id },
              data: { status: "BOOKED" },
            });
          }
        } else {
          const variantExists = await tx.productVariant.findUnique({
            where: { id: String(item.id) },
          });

          await tx.booking.create({
            data: {
              shopId,
              userId: user.id,
              variantId: variantExists ? item.id : null,
              expiresAt,
              status: "PENDING",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
