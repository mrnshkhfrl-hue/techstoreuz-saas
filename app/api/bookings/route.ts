import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { extractStorage } from "@/lib/product-images";

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

    // 24-hour expiration window
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bookedItemsDetails: Array<{
      title: string;
      price: number;
      battery?: number;
      storage?: string;
      region?: string | null;
      hasBox?: boolean;
      isUsed: boolean;
    }> = [];

    // Validate that only USED devices can be booked
    const nonUsed = items.filter((it) => it.type !== "USED");
    if (nonUsed.length > 0) {
      return NextResponse.json(
        { error: "Бронирование доступно только для Б/У устройств. Новые телефоны приобретаются в магазине." },
        { status: 400 }
      );
    }

    // 2. Create Bookings in transaction with immediate CONFIRMED status
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
              status: "CONFIRMED", // Immediately confirmed for 24h
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
              storage: extractStorage(usedExists.title),
              region: usedExists.region,
              hasBox: usedExists.hasBox,
              isUsed: true,
            });
          }
        }
      }
    });

    // 3. Send instant Telegram notification to store admins
    const targetAdmins = new Set<string>(["8603067434", "7949519588"]);
    (process.env.ADMIN_CHAT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => targetAdmins.add(id));

    try {
      const dbShop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          owner: true,
          admins: { include: { user: true } },
        },
      });
      if (dbShop?.owner?.telegramId) targetAdmins.add(dbShop.owner.telegramId);
      dbShop?.admins?.forEach((a) => {
        if (a.user?.telegramId) targetAdmins.add(a.user.telegramId);
      });
    } catch (dbErr) {
      console.warn("[Bookings] Could not query shop admins from DB:", dbErr);
    }

    const cleanPhone = String(phone).replace(/[^\d]/g, "");

    for (const adminId of Array.from(targetAdmins)) {
      for (const item of bookedItemsDetails) {
        try {
          const initialDeposit = Math.round(item.price * 0.3);
          const remaining = item.price - initialDeposit;
          const m6 = Math.round((remaining * 1.15) / 6);
          const m9 = Math.round((remaining * 1.20) / 9);
          const m12 = Math.round((remaining * 1.25) / 12);

          const messageText =
            `⚡ <b>БРОНЬ ОФОРМЛЕНА НА 24 ЧАСА (ПОДТВЕРЖДЕНО)</b> ⚡\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📲 <b>${item.title}</b>\n` +
            (item.region ? `🌏 Region: <b>${item.region}</b>\n` : `🌏 Region: <b>ZP/A</b>\n`) +
            `🧠 <b>${item.storage || "256gb"}</b>\n` +
            (item.battery ? `🔋 <b>${item.battery}%</b>\n` : `🔋 <b>100% (Yangi)</b>\n`) +
            `📦 korobka: <b>${item.hasBox ? "bor ✅" : "yo'q"}</b>\n` +
            `🛠️ holati: <b>${item.isUsed ? "ideal" : "yangi (запечатан)"}</b>\n` +
            `📝 Garantiya: <b>bor ✅</b>\n\n` +
            `💵 <b>${item.price.toLocaleString("en-US")}$</b>\n\n` +
            `Muddatli tolovga bor\n\n` +
            `📃 <b>${initialDeposit}$</b> boshlangich tolov✅\n\n` +
            `6 oy <b>${m6} $</b> 🔥\n` +
            `9 oy <b>${m9} $</b> 🤩\n` +
            `12 oy <b>${m12} $</b> 💵\n\n` +
            `📝 Kerakli hujjatlar (pasport kopiya)\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 <b>Mijoz:</b> ${user.name || "Клиент"}\n` +
            `📞 <b>Telefon:</b> <code>+${cleanPhone || phone}</code>\n` +
            `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>\n` +
            `📍 <b>Filial:</b> Samarqand sh., Gulobod ko'chasi, 1\n` +
            `⏰ <b>Muddati:</b> 24 soatga ushlab turiladi (Hold)`;

          // Telegram inline buttons require https:// URLs (tel: and tg:// are rejected by Bot API)
          const inlineKeyboardButtons: Array<Array<{ text: string; url: string }>> = [];
          if (cleanPhone) {
            inlineKeyboardButtons.push([
              { text: "💬 Открыть чат в Telegram", url: `https://t.me/+${cleanPhone}` },
            ]);
          }

          const sendResult = await sendMessage(
            adminId,
            messageText,
            inlineKeyboardButtons.length > 0
              ? {
                  reply_markup: {
                    inline_keyboard: inlineKeyboardButtons,
                  },
                }
              : undefined
          );

          if (!sendResult?.ok) {
            console.error(`[Bookings] Telegram API error notifying admin ${adminId}:`, sendResult);
          } else {
            console.log(`[Bookings] Notified admin ${adminId} successfully (message_id: ${sendResult.result?.message_id})`);
          }
        } catch (err) {
          console.error(`[Bookings] Failed to notify admin ${adminId}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, count: bookedItemsDetails.length });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
