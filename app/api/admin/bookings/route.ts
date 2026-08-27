import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, action } = body;

    if (!bookingId || !action || !["COMPLETE", "CANCEL"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: bookingId, action ('COMPLETE' | 'CANCEL')" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (action === "COMPLETE") {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "COMPLETED" },
        });

        if (booking.usedProductId) {
          await tx.usedProduct.update({
            where: { id: booking.usedProductId },
            data: { status: "SOLD_ONLINE" },
          });
        }
      } else if (action === "CANCEL") {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CANCELLED" },
        });

        if (booking.usedProductId) {
          await tx.usedProduct.update({
            where: { id: booking.usedProductId },
            data: { status: "AVAILABLE" },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update booking status" },
      { status: 500 }
    );
  }
}
