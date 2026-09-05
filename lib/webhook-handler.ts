import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In-memory cache for user registration states and languages
interface UserRegState {
  step: 'LANG' | 'NAME' | 'PHONE';
  lang: 'ru' | 'uz';
  name?: string;
}

const userStateCache = new Map<string, UserRegState>();
const userLangCache = new Map<string, string>();
const userRegisteredCache = new Set<string>();

function normalizePhone(rawPhone: string): string {
  let cleaned = String(rawPhone).trim();
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 9) {
    return `+998${digits}`;
  } else if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  } else if (digits.length > 0) {
    return cleaned.startsWith('+') ? cleaned : `+${digits}`;
  }
  return cleaned;
}

// Fast DB user check: checks if user exists AND has a verified phone
async function checkUserRegistrationFast(tgId: string): Promise<boolean> {
  if (userRegisteredCache.has(tgId)) return true;

  try {
    const dbUser = await Promise.race([
      prisma.user.findUnique({
        where: { telegramId: tgId },
        select: { phone: true },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 500)),
    ]);

    if (dbUser?.phone && dbUser.phone.length > 5) {
      userRegisteredCache.add(tgId);
      return true;
    }
  } catch (err) {
    console.error('[Webhook] DB user check error:', err);
  }

  return false;
}

export async function handleTelegramWebhook(req: Request, explicitToken?: string) {
  try {
    const rawEnvToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.BOT_TOKEN ||
      '8426826305:AAFOLp579bWZpwGZuYJyo1KDy36DM8WD3c8';
    const cleanEnvToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();
    const token = (explicitToken || cleanEnvToken).replace(/^["']|["']$/g, '').trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
    }

    const body = await req.json();
    const message = body.message || body.channel_post || body.edited_message;
    const callbackQuery = body.callback_query;

    const from = message?.from || callbackQuery?.from;
    const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
    const text = (message?.text || callbackQuery?.data || '').trim();
    const contact = message?.contact;
    const userId = from?.id || chatId;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const tgId = String(userId);

    // 1. SuperAdmin check (zero database latency)
    const superAdminRaw =
      process.env.SUPERADMIN_IDS ||
      process.env.NEXT_PUBLIC_SUPERADMIN_IDS ||
      process.env.ADMIN_CHAT_IDS ||
      process.env.NEXT_PUBLIC_ADMIN_IDS ||
      '7949519588,8603067434';

    const superAdminIds = superAdminRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const isOwner = superAdminIds.includes(tgId) || superAdminIds.includes(String(chatId));

    const rawAppUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_WEBAPP_URL ||
      process.env.WEBAPP_URL ||
      'https://techstoreuz.vercel.app';
    const appUrl = rawAppUrl.replace(/\/$/, '');

    const superAdminUrl = `${appUrl}/superadmin`;
    const storeUrl = appUrl;
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Techstoreuz';

    // 2. High-speed Telegram API sendMessage with strict AbortController timeout
    const sendTg = async (payload: {
      text: string;
      reply_markup?: any;
      parse_mode?: string;
    }) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            parse_mode: payload.parse_mode || 'HTML',
            ...payload,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        console.error('[Webhook] Send message error:', err);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const userName =
      userStateCache.get(tgId)?.name ||
      [from?.first_name, from?.last_name].filter(Boolean).join(" ") ||
      from?.username ||
      "User";

    const storeUserUrl = `${storeUrl}?tgId=${tgId}&name=${encodeURIComponent(userName)}`;
    const superAdminUserUrl = `${superAdminUrl}?tgId=${tgId}&name=${encodeURIComponent(userName)}`;

    // Helper: Build Main Menu
    const buildMainMenuKeyboard = (lang: string) => {
      const isUz = lang === 'uz';
      const openBtnText = isUz ? `🛍 ${storeName} do'konini ochish` : `🛍 Открыть ${storeName}`;
      const aboutText = isUz ? 'ℹ️ Biz haqimizda' : 'ℹ️ О нас';
      const supportText = isUz ? "📞 Qo'llab-quvvatlash" : '📞 Поддержка';
      const langText = isUz ? "🌐 Tilni o'zgartirish" : '🌐 Сменить язык';

      const keyboardRows: any[] = [
        [{ text: openBtnText, web_app: { url: storeUserUrl } }],
      ];

      if (isOwner) {
        keyboardRows.unshift([
          { text: '👑 Панель управления (SaaS)', web_app: { url: superAdminUserUrl } },
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

    const sendMainMenu = async (lang: string) => {
      const isUz = lang === 'uz';
      const welcomeMsg = isUz
        ? `👋 <b>Asosiy menyu</b>\n\n🛍 Pastdagi tugmani bosing va <b>${storeName}</b> do'koniga kiring!`
        : `👋 <b>Главное меню</b>\n\n🛍 Нажмите кнопку ниже, чтобы открыть магазин <b>${storeName}</b>!`;

      await sendTg({
        text: welcomeMsg,
        reply_markup: buildMainMenuKeyboard(lang),
      });
    };

    // Detect language preference (cached or Telegram app language)
    const userLanguageCode = from?.language_code?.toLowerCase() || '';
    const fallbackLang: 'ru' | 'uz' = userLanguageCode.startsWith('ru') ? 'ru' : 'uz';
    const currentLang = (userLangCache.get(tgId) || fallbackLang) as 'ru' | 'uz';

    // ── STEP A: Contact Shared (Phone Number Captured) ───────────────────
    if (contact && contact.phone_number) {
      const phone = normalizePhone(contact.phone_number);
      userRegisteredCache.add(tgId);

      const state = userStateCache.get(tgId);
      const fallbackName = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || from?.username || 'User';
      const finalName = state?.name || fallbackName;
      const lang = state?.lang || currentLang;

      userStateCache.delete(tgId);

      // Save user in DB
      try {
        await prisma.user.upsert({
          where: { telegramId: tgId },
          update: { phone, name: finalName },
          create: {
            telegramId: tgId,
            phone,
            name: finalName,
          },
        });
      } catch (e) {
        console.error('[User Phone Save Error]', e);
      }

      const successText =
        lang === 'uz'
          ? "✅ Telefon raqamingiz muvaffaqiyatli saqlandi! Ro'yxatdan o'tish yakunlandi."
          : '✅ Ваш номер телефона успешно сохранён! Регистрация завершена.';

      await sendTg({ text: successText });
      await sendMainMenu(lang);
      return NextResponse.json({ ok: true });
    }

    // ── STEP B: Language Selection ────────────────────────────────────────
    if (text === "🇺🇿 O'zbekcha" || text === '🇷🇺 Русский') {
      const newLang: 'ru' | 'uz' = text.includes("O'zbekcha") ? 'uz' : 'ru';
      userLangCache.set(tgId, newLang);

      const isRegistered = await checkUserRegistrationFast(tgId);

      if (isRegistered) {
        const langAck = newLang === 'uz' ? "✅ Til saqlandi: O'zbekcha" : '✅ Язык сохранён: Русский';
        await sendTg({ text: langAck });
        await sendMainMenu(newLang);
        return NextResponse.json({ ok: true });
      }

      // User not registered yet -> ask for Name and Surname
      userStateCache.set(tgId, { step: 'NAME', lang: newLang });

      const askName =
        newLang === 'uz'
          ? '📝 Iltimos, ism va familiyangizni kiriting:'
          : '📝 Пожалуйста, введите ваше имя и фамилию:';

      await sendTg({
        text: askName,
        reply_markup: { remove_keyboard: true },
      });
      return NextResponse.json({ ok: true });
    }

    // ── STEP C: Registration Check ───────────────────────────────────────
    const isUserRegistered = await checkUserRegistrationFast(tgId);

    // If NOT registered yet:
    if (!isUserRegistered) {
      // 1. /start command -> Show Language Selection
      if (text.startsWith('/start')) {
        userStateCache.set(tgId, { step: 'LANG', lang: fallbackLang });

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

      const userState = userStateCache.get(tgId);

      // 2. User typed their Name (either in NAME step or as free text)
      if (text && !text.startsWith('/')) {
        const enteredName = text.trim();
        const activeLang = userState?.lang || currentLang;

        userStateCache.set(tgId, { step: 'PHONE', lang: activeLang, name: enteredName });

        // Save name to DB in background
        prisma.user
          .upsert({
            where: { telegramId: tgId },
            update: { name: enteredName },
            create: { telegramId: tgId, name: enteredName },
          })
          .catch((e) => console.error('[Save Name Error]', e));

        const promptPhone =
          activeLang === 'uz'
            ? "📱 Iltimos, ro'yxatdan o'tishni yakunlash uchun pastdagi tugmani bosing va telefon raqamingizni yuboring:"
            : '📱 Пожалуйста, нажмите кнопку ниже, чтобы отправить номер телефона для завершения регистрации:';

        const btnText = activeLang === 'uz' ? '📞 Raqamni yuborish' : '📞 Отправить номер';

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

      // 3. Fallback prompt to request contact
      const activeLang = userState?.lang || currentLang;
      const promptPhone =
        activeLang === 'uz'
          ? "📱 Iltimos, pastdagi tugmani bosib telefon raqamingizni yuboring:"
          : '📱 Пожалуйста, нажмите кнопку ниже, чтобы отправить номер телефона:';

      await sendTg({
        text: promptPhone,
        reply_markup: {
          keyboard: [
            [
              {
                text: activeLang === 'uz' ? '📞 Raqamni yuborish' : '📞 Отправить номер',
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── STEP D: Registered User Actions ───────────────────────────────────

    if (text.startsWith('/start') || text === '👑 Панель управления (SaaS)') {
      await sendMainMenu(currentLang);
      return NextResponse.json({ ok: true });
    }

    if (text === 'ℹ️ Biz haqimizda' || text === 'ℹ️ О нас') {
      const isUz = currentLang === 'uz' || text === 'ℹ️ Biz haqimizda';
      const textRu =
        `📱 <b>О компании ${storeName}</b>\n` +
        `Мы — ваш надежный партнер в мире цифровых технологий и мобильных устройств. Наш главный девиз: «Огромный выбор, честные цены и мега-гарантия».\n\n` +
        `⚡ <b>Что мы предлагаем:</b>\n` +
        `• <b>Оригинальная техника:</b> Смартфоны, планшеты, аксессуары.\n` +
        `• <b>Trade-in & Рассрочка:</b> Выгодный обмен старых устройств на новые.\n` +
        `• <b>Гарантия и Сервис:</b> Полное сопровождение каждого заказа.\n\n` +
        `📍 <b>Наши адреса и контакты:</b>\n` +
        `🏢 <b>Главный филиал:</b> г. Самарканд, ул. Гульабад, 1.\n` +
        `🏢 <b>Филиал №2:</b> г. Самарканд, ТЦ «Makon Mall», 1-й этаж.\n` +
        `📞 <b>Единый номер:</b> +998 77 285-99-99`;

      const textUz =
        `📱 <b>${storeName} kompaniyasi haqida</b>\n` +
        `Biz — raqamli texnologiyalar va mobil qurilmalar olamida sizning ishonchli hamkoringizmiz. Asosiy shiorimiz: «Katta tanlov, halol narxlar va mega-kafolat».\n\n` +
        `⚡ <b>Biz nimani taklif qilamiz:</b>\n` +
        `• <b>Original texnika:</b> Smartfonlar, planshetlar, aksessuarlar.\n` +
        `• <b>Trade-in & Muddatli to'lov:</b> Eski gadjetni yangisiga almashtirish.\n` +
        `• <b>Kafolat va Servis:</b> Har bir buyurtma uchun ishonchli xizmat.\n\n` +
        `📍 <b>Bizning manzillar va kontaktlar:</b>\n` +
        `🏢 <b>Bosh filial:</b> Samarqand sh., Gulobod ko'chasi, 1.\n` +
        `🏢 <b>2-filial:</b> Samarqand sh., «Makon Mall» SM, 1-qavat.\n` +
        `📞 <b>Yagona raqam:</b> +998 77 285-99-99`;

      await sendTg({ text: isUz ? textUz : textRu });
      return NextResponse.json({ ok: true });
    }

    if (text === "📞 Qo'llab-quvvatlash" || text === '📞 Поддержка') {
      const isUz = currentLang === 'uz' || text === "📞 Qo'llab-quvvatlash";
      const supportMsg = isUz
        ? `📞 <b>Bizning mutaxassislarimiz bilan bog'lanish:</b>\n\n📞 Qo'ng'iroq: <b>+998 77 285-99-99</b>\n✈️ Telegram: @sebtech_admin\n\nHar qanday savol bo'yicha yordam berishdan mamnunmiz!`
        : `📞 <b>Связаться с нашими специалистами:</b>\n\n📞 Телефон: <b>+998 77 285-99-99</b>\n✈️ Telegram: @sebtech_admin\n\nМы всегда рады проконсультировать и помочь с выбором!`;

      await sendTg({ text: supportMsg });
      return NextResponse.json({ ok: true });
    }

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

    // Default fallback -> Main Menu
    await sendMainMenu(currentLang);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook] Internal Handler Error:', error);
    return NextResponse.json({ ok: true });
  }
}
