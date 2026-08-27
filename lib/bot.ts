import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "./prisma";

/**
 * Multi-tenant Bot factory.
 * Keeps instances in a Map to avoid exhausting connections or re-init per request.
 */
const globalForBots = globalThis as unknown as { botInstances: Map<string, Bot> | undefined };
const botInstances = globalForBots.botInstances ?? new Map<string, Bot>();

if (process.env.NODE_ENV !== "production") {
  globalForBots.botInstances = botInstances;
}

export async function getBotForShop(shopId: string): Promise<Bot | null> {
  if (botInstances.has(shopId)) {
    return botInstances.get(shopId)!;
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { tgBotToken: true, name: true }
  });

  if (!shop || !shop.tgBotToken) {
    return null;
  }

  const bot = new Bot(shop.tgBotToken);

  bot.command("start", async (ctx) => {
    // Generate WebApp URL specific to this shop
    const baseUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://tg-shop.vercel.app";
    const webAppUrl = `${baseUrl}?shopId=${shopId}`;

    const keyboard = new InlineKeyboard().webApp(
      `🛍 Открыть ${shop.name}`,
      webAppUrl
    );

    await ctx.reply(
      `👋 *Добро пожаловать в ${shop.name}!*\n\n` +
      `Здесь вы можете выбрать электронику, оценить ваше б/у устройство по программе *Trade-In* и оформить заказ в 2 клика.`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  });

  bot.catch((err) => {
    console.error(`[grammY - Shop ${shopId}] Bot error:`, err.message);
  });

  botInstances.set(shopId, bot);
  return bot;
}

// Fallback legacy bot for backward compatibility if needed by old routes
export const bot: Bot | null = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN
  ? new Bot(process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "")
  : null;
