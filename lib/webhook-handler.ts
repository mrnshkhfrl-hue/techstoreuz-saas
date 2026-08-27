import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function handleTelegramWebhook(req: Request, explicitToken?: string) {
  try {
    const rawEnvToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
    const cleanEnvToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();
    const token = (explicitToken || cleanEnvToken).replace(/^["']|["']$/g, '').trim();

    if (!token) {
      console.error('[Webhook] Missing Telegram Bot Token');
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
    }

    const body = await req.json();
    const message = body.message || body.channel_post || body.edited_message;
    const callbackQuery = body.callback_query;

    const from = message?.from || callbackQuery?.from;
    const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
    const text = message?.text || callbackQuery?.data || '';
    const userId = from?.id || chatId;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // 1. Check SuperAdmin status
    const superAdminRaw =
      process.env.SUPERADMIN_IDS ||
      process.env.NEXT_PUBLIC_SUPERADMIN_IDS ||
      process.env.ADMIN_CHAT_IDS ||
      process.env.NEXT_PUBLIC_ADMIN_IDS ||
      '7949519588';

    const superAdminIds = superAdminRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const isOwner =
      (userId && superAdminIds.includes(String(userId))) ||
      (chatId && superAdminIds.includes(String(chatId)));

    // 2. Find Shop in database by Bot Token or fallback
    let shop = null;
    try {
      shop = await prisma.shop.findUnique({
        where: { tgBotToken: token },
      });
      if (!shop) {
        shop = await prisma.shop.findFirst();
      }
    } catch (dbErr) {
      console.error('[Webhook] DB shop search error:', dbErr);
    }

    // 3. Upsert User in DB
    if (userId) {
      try {
        const fullName = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || 'Telegram User';
        await prisma.user.upsert({
          where: { telegramId: String(userId) },
          update: {
            name: fullName,
          },
          create: {
            telegramId: String(userId),
            name: fullName,
          },
        });
      } catch (userErr) {
        console.error('[Webhook] User upsert error:', userErr);
      }
    }

    // 4. Determine WebApp URLs
    const rawAppUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_WEBAPP_URL ||
      process.env.WEBAPP_URL ||
      'https://techstoreuz-saas.vercel.app';
    const appUrl = rawAppUrl.replace(/\/$/, '');

    const superAdminUrl = `${appUrl}/superadmin`;
    const storeUrl = shop ? `${appUrl}?shopId=${shop.id}` : appUrl;
    const storeName = shop?.name || process.env.NEXT_PUBLIC_STORE_NAME || 'Techstoreuz';

    // 5. Formulate response based on whether user is Owner or Regular Customer
    let replyText = '';
    let replyMarkup = {};

    if (isOwner) {
      replyText = `👋 <b>Добро пожаловать, Владелец!</b>\n\nВы авторизованы как супер-администратор платформы SaaS.\nНажмите кнопку ниже для управления платформой и магазинами:`;
      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '👑 Панель управления',
              web_app: { url: superAdminUrl },
            },
          ],
          [
            {
              text: `🛍 Открыть витрину (${storeName})`,
              web_app: { url: storeUrl },
            },
          ],
        ],
      };
    } else {
      replyText = `👋 <b>Добро пожаловать в ${storeName}!</b>\n\n🛍 Нажмите кнопку ниже, чтобы открыть наш магазин, ознакомиться с каталогом и оформить заказ:`;
      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: `🛍 Открыть ${storeName}`,
              web_app: { url: storeUrl },
            },
          ],
        ],
      };
    }

    // 6. Send message back to Telegram
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('[Webhook] Telegram sendMessage failed:', errText);
    }

    // Answer callback query if applicable
    if (callbackQuery?.id) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        });
      } catch (cbErr) {
        console.error('[Webhook] answerCallbackQuery error:', cbErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook] Internal Handler Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram so it doesn't retry infinitely
  }
}
