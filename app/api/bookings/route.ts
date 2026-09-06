import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";

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
    const bookedItemsDetails: Array<{
      title: string;
      price: number;
      battery?: number;
      storage?: string;
      isUsed: boolean;
    }> = [];

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

            bookedItemsDetails.push({
              title: usedExists.title,
              price: usedExists.price,
              battery: usedExists.batteryHealth,
              isUsed: true,
            });
          }
        } else {
          const variantExists = await tx.productVariant.findUnique({
            where: { id: String(item.id) },
            include: { template: true },
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

          if (variantExists) {
            bookedItemsDetails.push({
              title: `${variantExists.template.title} (${variantExists.storage})`,
              price: variantExists.price,
              storage: variantExists.storage,
              isUsed: false,
            });
          }
        }
      }
    });

    // 3. Send instant Telegram notification to store admins
    const adminChatIds = (process.env.ADMIN_CHAT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const adminId of adminChatIds) {
      for (const item of bookedItemsDetails) {
        try {
          const isUsedOrder = item.isUsed;
          const header = isUsedOrder
            ? `📌 <b>НОВАЯ ЗАЯВКА НА БРОНЬ Б/У!</b>`
            : `🛍️ <b>НОВЫЙ ЗАКАЗ (НОВОЕ УСТРОЙСТВО)!</b>`;
          const footerAction = isUsedOrder
            ? `⚡ <i>Позвоните клиенту для подтверждения брони Б/У!</i>`
            : `⚡ <i>Позвоните клиенту для подтверждения заказа и доставки!</i>`;

          await sendMessage(
            adminId,
            `${header}\n\n` +
            `📱 <b>Устройство:</b> ${item.title}\n` +
            (item.battery ? `🔋 <b>АКБ:</b> ${item.battery}%\n` : "") +
            (item.storage ? `💾 <b>Память:</b> ${item.storage}\n` : "") +
            `💵 <b>Цена:</b> $${item.price.toLocaleString("en-US")}\n\n` +
            `👤 <b>Клиент:</b> ${user.name || "Клиент"}\n` +
            `📞 <b>Телефон:</b> <code>${phone}</code>\n` +
            `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>\n` +
            `📍 <b>Филиал:</b> г. Самарканд, ул. Гульабад, 1\n\n` +
            footerAction,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "📞 Позвонить", url: `tel:${phone}` },
                    { text: "💬 Написать в TG", url: `tg://user?id=${telegramId}` },
                  ],
                ],
              },
            }
          );
        } catch (err) {
          console.error(`[Bookings] Failed to notify admin ${adminId}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
