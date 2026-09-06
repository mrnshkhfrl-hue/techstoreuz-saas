import { Bot, Keyboard } from "grammy";
import { prisma } from "./prisma";

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing");
}

export const bot = new Bot(token);

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || process.env.STORE_NAME || "TechStore";
const WEBAPP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.WEBAPP_URL || "https://tma-frontend-phi.vercel.app").replace(/\/$/, "");

// Helper to send Main Menu
async function sendMainMenu(ctx: any, lang: string) {
  const isUz = lang === "uz";
  const text = isUz 
    ? `Asosiy menyu.\n\n🛍 Pastdagi tugmani bosing va ${STORE_NAME} do'koniga kiring!`
    : `Главное меню.\n\n🛍 Нажмите кнопку ниже, чтобы открыть магазин ${STORE_NAME}!`;

  const btnText = isUz ? `🛍 ${STORE_NAME} do'konini ochish` : `🛍 Открыть ${STORE_NAME}`;
  const aboutText = isUz ? "ℹ️ Biz haqimizda" : "ℹ️ О нас";
  const supportText = isUz ? "📞 Qo'llab-quvvatlash" : "📞 Поддержка";
  const langText = isUz ? "🌐 Tilni o'zgartirish" : "🌐 Сменить язык";

  const webAppUrlWithLang = `${WEBAPP_URL}?lang=${lang.toUpperCase()}`;
  const keyboard = new Keyboard()
    .webApp(btnText, webAppUrlWithLang).row()
    .text(aboutText).text(supportText).row()
    .text(langText).resized();

  await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
}

// Default language for new users
const DEFAULT_LANG = "uz";

// Language preference cache backed by DB
const langCache = new Map<string, string>();

async function getUserLang(tgId: string): Promise<string> {
  const cached = langCache.get(tgId);
  if (cached) return cached;
  try {
    const u = await prisma.user.findUnique({ where: { telegramId: tgId }, select: { address: true } });
    if (u?.address === "uz" || u?.address === "ru") {
      langCache.set(tgId, u.address);
      return u.address;
    }
  } catch {}
  return DEFAULT_LANG;
}

async function setUserLang(tgId: string, lang: string) {
  langCache.set(tgId, lang);
  try {
    await prisma.user.upsert({
      where: { telegramId: tgId },
      update: { address: lang },
      create: { telegramId: tgId, address: lang },
    });
  } catch {}
}

// Strict Registration Interceptor Middleware
bot.use(async (ctx, next) => {
  if (!ctx.from || !ctx.message) return next();

  const tgId = String(ctx.from.id);
  const text = ctx.message.text;

  // Always allow /start command to initialize/restart registration
  if (text?.startsWith("/start")) {
    return next();
  }

  const user = await prisma.user.findUnique({ where: { telegramId: tgId } });
  
  // If user is missing or has no phone number -> Enforce Registration Steps
  if (!user || !user.phone) {
    const lang = await getUserLang(tgId);

    // 1. Language choice buttons -> pass to hears handler
    if (text && ["🇺🇿 O'zbekcha", "🇷🇺 Русский"].includes(text)) {
      return next();
    }

    // 2. Contact shared -> Save phone & send Main Menu
    if (ctx.message.contact) {
      const phone = ctx.message.contact.phone_number;
      const fullName = `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "User";
      await prisma.user.upsert({
        where: { telegramId: tgId },
        update: { phone },
        create: {
          telegramId: tgId,
          phone,
          name: fullName,
        }
      });

      await ctx.reply(lang === "uz" ? "✅ Raqam saqlandi!" : "✅ Номер сохранён!", { parse_mode: "HTML" });
      await sendMainMenu(ctx, lang);
      return; // Handled! Stop execution chain
    }

    // 3. User sent text (Name & Surname)
    if (text) {
      await prisma.user.upsert({
        where: { telegramId: tgId },
        update: { name: text.trim() },
        create: {
          telegramId: tgId,
          name: text.trim(),
        }
      });

      const prompt = lang === "uz" 
        ? "📱 Iltimos, ro'yxatdan o'tish uchun telefon raqamingizni yuboring:"
        : "📱 Пожалуйста, отправьте свой номер телефона для регистрации:";
      const btn = lang === "uz" ? "📞 Raqamni yuborish" : "📞 Отправить номер";

      const kb = new Keyboard().requestContact(btn).resized().oneTime();
      await ctx.reply(prompt, { reply_markup: kb, parse_mode: "HTML" });
      return; // Handled! Stop execution chain
    }

    // 4. Any other non-text or non-contact message -> prompt for contact again
    const prompt = lang === "uz" 
      ? "📱 Iltimos, pastdagi tugmani bosib raqamingizni yuboring:"
      : "📱 Пожалуйста, нажмите кнопку ниже, чтобы отправить номер:";
    const btn = lang === "uz" ? "📞 Raqamni yuborish" : "📞 Отправить номер";
    const kb = new Keyboard().requestContact(btn).resized().oneTime();
    await ctx.reply(prompt, { reply_markup: kb, parse_mode: "HTML" });
    return;
  }

  // User is fully registered (has phone) -> proceed to feature handlers
  return next();
});

bot.command("start", async (ctx) => {
  const tgId = String(ctx.from?.id);
  const fullName = `${ctx.from?.first_name || ""} ${ctx.from?.last_name || ""}`.trim() || "User";

  const user = await prisma.user.upsert({
    where: { telegramId: tgId },
    update: { name: fullName },
    create: {
      telegramId: tgId,
      name: fullName,
    }
  });

  const lang = await getUserLang(tgId);

  const payload = ctx.match;
  if (payload === "bind_phone") {
    const prompt = lang === "uz" 
      ? "📱 Iltimos, ro'yxatdan o'tish uchun telefon raqamingizni yuboring:"
      : "📱 Пожалуйста, отправьте свой номер телефона для регистрации:";
    const btn = lang === "uz" ? "📞 Raqamni yuborish" : "📞 Отправить номер";
    const kb = new Keyboard().requestContact(btn).resized().oneTime();
    return ctx.reply(prompt, { reply_markup: kb, parse_mode: "HTML" });
  }

  // If user is fully registered with phone -> send Main Menu
  if (user.phone) {
    return sendMainMenu(ctx, lang);
  }

  // Otherwise start registration: Ask for language
  const welcomeText = `👋 Xush kelibsiz <b>${STORE_NAME}</b> do'koniga!\n\nДобро пожаловать в <b>${STORE_NAME}</b>!\n\nIltimos, tilni tanlang / Пожалуйста, выберите язык:`;
  const kb = new Keyboard().text("🇺🇿 O'zbekcha").text("🇷🇺 Русский").resized().oneTime();
  await ctx.reply(welcomeText, { reply_markup: kb, parse_mode: "HTML" });
});

bot.hears(["🇺🇿 O'zbekcha", "🇷🇺 Русский"], async (ctx) => {
  const isUz = ctx.message?.text?.includes("O'zbekcha");
  const lang = isUz ? "uz" : "ru";
  const tgId = String(ctx.from?.id);
  
  // Store language preference in cache and DB
  await setUserLang(tgId, lang);

  const user = await prisma.user.findUnique({ where: { telegramId: tgId } });

  // If already registered with phone, just acknowledge language change and return to menu
  if (user?.phone) {
    await ctx.reply(isUz ? "✅ Til saqlandi: O'zbekcha" : "✅ Язык сохранён: Русский", { parse_mode: "HTML" });
    return sendMainMenu(ctx, lang);
  }

  // If not registered yet, prompt for Name & Surname
  const prompt = lang === "uz" ? "📝 Iltimos, ism va familiyangizni kiriting:" : "📝 Пожалуйста, введите ваше имя и фамилию:";
  await ctx.reply(prompt, { reply_markup: { remove_keyboard: true }, parse_mode: "HTML" });
});

bot.hears(["ℹ️ Biz haqimizda", "ℹ️ О нас"], async (ctx) => {
  const isUz = ctx.message?.text === "ℹ️ Biz haqimizda";
  const textRu = "📱 <b>О компании SEBTECH</b>\nМы — ваш надежный партнер в мире цифровых технологий и мобильных устройств в Самарканде. Наш главный девиз: «Огромный выбор, честные цены и мега-гарантия». Мы работаем на совесть и предлагаем только проверенную и оригинальную технику.\n\n⚡ <b>Что мы предлагаем</b>\n• <b>Оригинальная техника:</b> Широкий ассортимент смартфонов, планшетов и аксессуаров.\n• <b>Честная рассрочка и Trade-in:</b> Выгодные условия покупки без переплат и возможность обменять старый телефон на новый по системе трейд-ин.\n• <b>Профессиональный ремонт:</b> Быстрый ремонт любой сложности для устройств Apple и Samsung.\n• <b>Надежное страхование:</b> Уникальные страховые тарифы для защиты ваших гаджетов от непредвиденных повреждений.\n\n📍 <b>Наши адреса и контакты</b>\n🏢 <b>Филиал №1 (Главный):</b> г. Самарканд, ул. Гульабад, 1.\n🏢 <b>Филиал №2:</b> г. Самарканд, ТЦ «Makon Mall», 1-й этаж.\n📞 <b>Единый номер:</b> +998 77 285-99-99.\n\nСледите за нашими акциями в Instagram-аккаунте SEBTECH!";
  const textUz = "📱 <b>SEBTECH kompaniyasi haqida</b>\nBiz — Samarqanddagi raqamli texnologiyalar va mobil qurilmalar olamida sizning ishonchli hamkoringizmiz. Asosiy shiorimiz: «Katta tanlov, halol narxlar va mega-kafolat».\n\n⚡ <b>Biz nimani taklif qilamiz</b>\n• <b>Original texnika:</b> Smartfonlar, planshetlar va aksessuarlarning keng assortimenti.\n• <b>Halol muddatli to'lov va Trade-in:</b> Foydali xarid shartlari va eski telefonni yangisiga almashtirish imkoniyati.\n• <b>Professional ta'mir:</b> Apple va Samsung qurilmalari uchun.\n• <b>Ishonchli sug'urta:</b> Gadjetlaringizni himoya qilish uchun.\n\n📍 <b>Bizning manzillar va kontaktlar</b>\n🏢 <b>1-filial:</b> Samarqand sh., Gulobod ko'chasi, 1.\n🏢 <b>2-filial:</b> Samarqand sh., «Makon Mall» SM, 1-qavat.\n📞 <b>Yagona raqam:</b> +998 77 285-99-99.\n\nAksiyalarimizni SEBTECH Instagram sahifasida kuzatib boring!";
  
  const text = isUz ? textUz : textRu;
  const photoUrl = "https://raw.githubusercontent.com/mrnshkx/Landing-b2b/main/public/SEBTECH.jpg";
  try {
    await ctx.replyWithPhoto(photoUrl, { caption: text, parse_mode: "HTML" });
  } catch {
    await ctx.reply(text, { parse_mode: "HTML" });
  }
});

bot.hears(["📞 Qo'llab-quvvatlash", "📞 Поддержка"], async (ctx) => {
  const isUz = ctx.message?.text === "📞 Qo'llab-quvvatlash";
  const text = isUz 
    ? "📞 Bizning mutaxassislarimiz bilan bog'lanish:\n\n📞 <b>+998 77 285-99-99</b>\n✈️ Telegram: @mrnshkx"
    : "📞 Связаться с нашими специалистами:\n\n📞 <b>+998 77 285-99-99</b>\n✈️ Telegram: @mrnshkx";
  await ctx.reply(text, { parse_mode: "HTML" });
});

bot.hears(["🌐 Tilni o'zgartirish", "🌐 Сменить язык"], async (ctx) => {
  const text = "Iltimos, tilni tanlang / Пожалуйста, выберите язык:";
  const kb = new Keyboard().text("🇺🇿 O'zbekcha").text("🇷🇺 Русский").resized().oneTime();
  await ctx.reply(text, { reply_markup: kb, parse_mode: "HTML" });
});

bot.command("broadcast", async (ctx) => {
  const adminIdsStr = process.env.ADMIN_CHAT_IDS || process.env.SUPERADMIN_IDS || "";
  const adminIds = adminIdsStr.split(",").map(s => Number(s.trim()));
  if (!ctx.from || !adminIds.includes(ctx.from.id)) return;

  const text = ctx.message?.text?.replace("/broadcast", "").trim();
  if (!text) {
    return ctx.reply("Укажите текст рассылки. Пример: /broadcast Всем скидки!");
  }

  await ctx.reply("⏳ Начинаю рассылку...");
  // Broadcast to all registered users with phone numbers
  const users = await prisma.user.findMany({ where: { phone: { not: null } } });
  let success = 0;
  let fails = 0;
  for (const u of users) {
    try {
      await bot.api.sendMessage(Number(u.telegramId), text);
      success++;
    } catch {
      fails++;
    }
  }
  await ctx.reply(`✅ Рассылка завершена.\n📨 Успешно: ${success}\n❌ Ошибок: ${fails}`);
});

bot.catch((err) => {
  console.error("Webhook Bot error:", err);
});
