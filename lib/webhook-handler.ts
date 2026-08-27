import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In-memory language cache per telegram ID
const langCache = new Map<string, string>();

function getUserLang(tgId: string): string {
  return langCache.get(tgId) || 'uz';
}

function setUserLang(tgId: string, lang: string) {
  langCache.set(tgId, lang);
}

export async function handleTelegramWebhook(req: Request, explicitToken?: string) {
  try {
    const rawEnvToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '8426826305:AAFOLp579bWZpwGZuYJyo1KDy36DM8WD3c8';
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
    const text = message?.text?.trim() || callbackQuery?.data || '';
    const contact = message?.contact;
    const userId = from?.id || chatId;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const tgId = String(userId);

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

    const isOwner = superAdminIds.includes(tgId) || superAdminIds.includes(String(chatId));

    // 2. Find Shop in database by Bot Token or slug / fallback
    let shop = null;
    try {
      shop = await prisma.shop.findUnique({
        where: { tgBotToken: token },
        include: { branches: true },
      });
      if (!shop) {
        shop = await prisma.shop.findFirst({
          include: { branches: true },
        });
      }
    } catch (dbErr) {
      console.error('[Webhook] DB shop search error:', dbErr);
    }

    const rawAppUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_WEBAPP_URL ||
      process.env.WEBAPP_URL ||
      'https://techstoreuz.vercel.app';
    const appUrl = rawAppUrl.replace(/\/$/, '');

    const superAdminUrl = `${appUrl}/superadmin`;
    const storeUrl = shop ? `${appUrl}?shopId=${shop.id}` : appUrl;
    const storeName = shop?.name || process.env.NEXT_PUBLIC_STORE_NAME || 'Techstoreuz';

    // 3. Helpers to communicate with Telegram API
    const sendTg = async (payload: {
      text: string;
      reply_markup?: any;
      parse_mode?: string;
    }) => {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            parse_mode: payload.parse_mode || 'HTML',
            ...payload,
          }),
        });
      } catch (err) {
        console.error('[Webhook] Send message error:', err);
      }
    };

    // Helper to dynamically set or remove Menu Button for this chat
    const setMenuButtonForChat = async (enabled: boolean) => {
      try {
        await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            menu_button: enabled
              ? {
                  type: 'web_app',
                  text: 'Магазин',
                  web_app: { url: storeUrl },
                }
              : {
                  type: 'default',
                },
          }),
        });
      } catch (err) {
        console.error('[Webhook] setChatMenuButton error:', err);
      }
    };

    // Helper to build Main Menu Keyboard
    const buildMainMenuKeyboard = (lang: string) => {
      const isUz = lang === 'uz';
      const openBtnText = isUz ? `🛍 ${storeName} do'konini ochish` : `🛍 Открыть ${storeName}`;
      const aboutText = isUz ? 'ℹ️ Biz haqimizda' : 'ℹ️ О нас';
      const supportText = isUz ? "📞 Qo'llab-quvvatlash" : '📞 Поддержка';
      const langText = isUz ? "🌐 Tilni o'zgartirish" : '🌐 Сменить язык';

      const keyboardRows: any[] = [
        [{ text: openBtnText, web_app: { url: storeUrl } }],
      ];

      // Add SuperAdmin button if user is platform owner
      if (isOwner) {
        keyboardRows.unshift([
          { text: '👑 Панель управления (SaaS)', web_app: { url: superAdminUrl } },
        ]);
      }

      keyboardRows.push([
        { text: aboutText },
        { text: supportText },
      ]);
      keyboardRows.push([
        { text: langText },
      ]);

      return {
        keyboard: keyboardRows,
        resize_keyboard: true,
      };
    };

    // Helper to send Main Menu
    const sendMainMenu = async (lang: string) => {
      const isUz = lang === 'uz';
      const welcomeMsg = isUz
        ? `👋 <b>Asosiy menyu</b>\n\n🛍 Pastdagi tugmani bosing va <b>${storeName}</b> do'koniga kiring!`
        : `👋 <b>Главное меню</b>\n\n🛍 Нажмите кнопку ниже, чтобы открыть магазин <b>${storeName}</b>!`;

      // Enable WebApp button for registered user
      await setMenuButtonForChat(true);

      await sendTg({
        text: welcomeMsg,
        reply_markup: buildMainMenuKeyboard(lang),
      });
    };

    // 4. Retrieve or Create User in DB
    let user = await prisma.user.findUnique({
      where: { telegramId: tgId },
    });

    if (!user) {
      const fullName = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || 'User';
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          name: fullName,
        },
      });
    }

    const currentLang = getUserLang(tgId);

    // ── STEP A: Contact Sharing Handler ───────────────────────────────────
    if (contact && contact.phone_number) {
      const phone = contact.phone_number;
      await prisma.user.update({
        where: { telegramId: tgId },
        data: { phone },
      });

      const successText = currentLang === 'uz'
        ? '✅ Telefon raqamingiz muvaffaqiyatli saqlandi!'
        : '✅ Ваш номер телефона успешно сохранён!';

      await sendTg({ text: successText });
      await sendMainMenu(currentLang);
      return NextResponse.json({ ok: true });
    }

    // ── STEP B: Language Selection ────────────────────────────────────────
    if (text === "🇺🇿 O'zbekcha" || text === '🇷🇺 Русский') {
      const newLang = text.includes("O'zbekcha") ? 'uz' : 'ru';
      setUserLang(tgId, newLang);

      if (user.phone || isOwner) {
        const langAck = newLang === 'uz' ? "✅ Til saqlandi: O'zbekcha" : '✅ Язык сохранён: Русский';
        await sendTg({ text: langAck });
        await sendMainMenu(newLang);
        return NextResponse.json({ ok: true });
      }

      // If no phone yet -> ask for Name & Surname
      const askName = newLang === 'uz'
        ? '📝 Iltimos, ism va familiyangizni kiriting:'
        : '📝 Пожалуйста, введите ваше имя и фамилию:';

      await sendTg({
        text: askName,
        reply_markup: { remove_keyboard: true },
      });
      return NextResponse.json({ ok: true });
    }

    // ── STEP C: Check if user registration is INCOMPLETE (no phone) ────────
    if (!user.phone && !isOwner) {
      // Ensure menu button in chat input is disabled for unregistered user
      await setMenuButtonForChat(false);

      // If /start command -> Show Language Selection
      if (text.startsWith('/start')) {
        const welcomeText = `👋 Xush kelibsiz <b>${storeName}</b> do'koniga!\n\nДобро пожаловать в <b>${storeName}</b>!\n\nIltimos, tilni tanlang / Пожалуйста, выберите язык:`;
        await sendTg({
          text: welcomeText,
          reply_markup: {
            keyboard: [[{ text: "🇺🇿 O'zbekcha" }, { text: '🇷🇺 Русский' }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
        return NextResponse.json({ ok: true });
      }

      // If user typed their name -> Save Name and prompt for Phone number
      if (text && !text.startsWith('/')) {
        await prisma.user.update({
          where: { telegramId: tgId },
          data: { name: text },
        });

        const promptPhone = currentLang === 'uz'
          ? "📱 Iltimos, ro'yxatdan o'tishni yakunlash uchun telefon raqamingizni yuboring:"
          : '📱 Пожалуйста, отправьте свой номер телефона для завершения регистрации:';

        const btnText = currentLang === 'uz' ? '📞 Raqamni yuborish' : '📞 Отправить номер';

        await sendTg({
          text: promptPhone,
          reply_markup: {
            keyboard: [[{ text: btnText, request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
        return NextResponse.json({ ok: true });
      }

      // Fallback prompt for contact
      const promptPhone = currentLang === 'uz'
        ? "📱 Iltimos, pastdagi tugmani bosib raqamingizni yuboring:"
        : '📱 Пожалуйста, нажмите кнопку ниже, чтобы отправить номер:';

      await sendTg({
        text: promptPhone,
        reply_markup: {
          keyboard: [[{ text: currentLang === 'uz' ? '📞 Raqamni yuborish' : '📞 Отправить номер', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── STEP D: Registered User Actions ───────────────────────────────────

    // 1. /start
    if (text.startsWith('/start')) {
      await sendMainMenu(currentLang);
      return NextResponse.json({ ok: true });
    }

    // 2. ℹ️ Biz haqimizda / ℹ️ О нас
    if (text === 'ℹ️ Biz haqimizda' || text === 'ℹ️ О нас') {
      const isUz = currentLang === 'uz' || text === 'ℹ️ Biz haqimizda';
      const branchesInfo = shop?.branches && shop.branches.length > 0
        ? shop.branches.map((b, i) => `📍 <b>${b.name}:</b> ${b.address} (${b.phone || '+998 77 285-99-99'})`).join('\n')
        : (isUz ? "🏢 <b>Bosh filial:</b> Samarqand sh., Gulobod ko'chasi, 1.\n🏢 <b>2-filial:</b> Samarqand sh., «Makon Mall» SM, 1-qavat." : "🏢 <b>Главный филиал:</b> г. Самарканд, ул. Гульабад, 1.\n🏢 <b>Филиал №2:</b> г. Самарканд, ТЦ «Makon Mall», 1-й этаж.");

      const textRu = `📱 <b>О компании ${storeName}</b>\n` +
        `Мы — ваш надежный партнер в мире цифровых технологий и мобильных устройств. Наш главный девиз: «Огромный выбор, честные цены и мега-гарантия».\n\n` +
        `⚡ <b>Что мы предлагаем:</b>\n` +
        `• <b>Оригинальная техника:</b> Смартфоны, планшеты, аксессуары.\n` +
        `• <b>Trade-in & Рассрочка:</b> Выгодный обмен старых устройств на новые.\n` +
        `• <b>Гарантия и Сервис:</b> Полное сопровождение каждого заказа.\n\n` +
        `📍 <b>Наши адреса и контакты:</b>\n${branchesInfo}\n` +
        `📞 <b>Единый номер:</b> +998 77 285-99-99`;

      const textUz = `📱 <b>${storeName} kompaniyasi haqida</b>\n` +
        `Biz — raqamli texnologiyalar va mobil qurilmalar olamida sizning ishonchli hamkoringizmiz. Asosiy shiorimiz: «Katta tanlov, halol narxlar va mega-kafolat».\n\n` +
        `⚡ <b>Biz nimani taklif qilamiz:</b>\n` +
        `• <b>Original texnika:</b> Smartfonlar, planshetlar, aksessuarlar.\n` +
        `• <b>Trade-in & Muddatli to'lov:</b> Eski gadjetni yangisiga almashtirish.\n` +
        `• <b>Kafolat va Servis:</b> Har bir buyurtma uchun ishonchli xizmat.\n\n` +
        `📍 <b>Bizning manzillar va kontaktlar:</b>\n${branchesInfo}\n` +
        `📞 <b>Yagona raqam:</b> +998 77 285-99-99`;

      await sendTg({ text: isUz ? textUz : textRu });
      return NextResponse.json({ ok: true });
    }

    // 3. 📞 Qo'llab-quvvatlash / 📞 Поддержка
    if (text === "📞 Qo'llab-quvvatlash" || text === '📞 Поддержка') {
      const isUz = currentLang === 'uz' || text === "📞 Qo'llab-quvvatlash";
      const supportMsg = isUz
        ? `📞 <b>Bizning mutaxassislarimiz bilan bog'lanish:</b>\n\n📞 Qo'ng'iroq: <b>+998 77 285-99-99</b>\n✈️ Telegram: @sebtech_admin\n\nHar qanday savol bo'yicha yordam berishdan mamnunmiz!`
        : `📞 <b>Связаться с нашими специалистами:</b>\n\n📞 Телефон: <b>+998 77 285-99-99</b>\n✈️ Telegram: @sebtech_admin\n\nМы всегда рады проконсультировать и помочь с выбором!`;

      await sendTg({ text: supportMsg });
      return NextResponse.json({ ok: true });
    }

    // 4. 🌐 Tilni o'zgartirish / 🌐 Сменить язык
    if (text === "🌐 Tilni o'zgartirish" || text === '🌐 Сменить язык') {
      await sendTg({
        text: 'Iltimos, tilni tanlang / Пожалуйста, выберите язык:',
        reply_markup: {
          keyboard: [[{ text: "🇺🇿 O'zbekcha" }, { text: '🇷🇺 Русский' }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Default fallback -> send main menu
    await sendMainMenu(currentLang);

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
    return NextResponse.json({ ok: true });
  }
}
