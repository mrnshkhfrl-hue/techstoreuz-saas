/**
 * Telegram Bot API Helper — Serverless-compatible
 * Replaces aiogram/aiohttp with native fetch calls.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  contact?: TelegramContact;
  photo?: TelegramPhotoSize[];
  reply_markup?: any;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  channel_post?: TelegramMessage;
}

// ─── Inline Keyboard Builders ───────────────────────────────────────────────

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

export interface ReplyKeyboardButton {
  text: string;
  request_contact?: boolean;
}

export function inlineKeyboard(rows: InlineKeyboardButton[][]): object {
  return { inline_keyboard: rows };
}

export function replyKeyboard(
  rows: ReplyKeyboardButton[][],
  opts?: { resize_keyboard?: boolean; one_time_keyboard?: boolean }
): object {
  return {
    keyboard: rows,
    resize_keyboard: opts?.resize_keyboard ?? true,
    one_time_keyboard: opts?.one_time_keyboard ?? false,
  };
}

export function removeKeyboard(): object {
  return { remove_keyboard: true };
}

// ─── Core API Calls ─────────────────────────────────────────────────────────

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

async function callTelegramAPI(method: string, body: Record<string, any>): Promise<any> {
  const token = BOT_TOKEN();
  if (!token) {
    console.error(`[Telegram] Missing BOT_TOKEN for method ${method}`);
    return { ok: false, description: "Missing BOT_TOKEN" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error(`[Telegram] ${method} failed:`, data.description);
    }

    return data;
  } catch (error) {
    console.error(`[Telegram] ${method} network error:`, error);
    return { ok: false, description: String(error) };
  }
}

// ─── Public Methods ─────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: object;
  }
): Promise<any> {
  return callTelegramAPI("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
}

export async function sendPhoto(
  chatId: number | string,
  photo: string, // file_id or URL
  options?: {
    caption?: string;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: object;
  }
): Promise<any> {
  return callTelegramAPI("sendPhoto", {
    chat_id: chatId,
    photo,
    caption: options?.caption,
    parse_mode: options?.parse_mode ?? "HTML",
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: { text?: string; show_alert?: boolean }
): Promise<any> {
  return callTelegramAPI("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: options?.text,
    show_alert: options?.show_alert ?? false,
  });
}

export async function setWebhook(url: string, secret?: string): Promise<any> {
  const body: Record<string, any> = { url };
  if (secret) body.secret_token = secret;

  // Set allowed updates to only the ones we handle
  body.allowed_updates = ["message", "callback_query", "channel_post"];

  return callTelegramAPI("setWebhook", body);
}

export async function deleteWebhook(): Promise<any> {
  return callTelegramAPI("deleteWebhook", { drop_pending_updates: false });
}

export async function setMyCommands(
  commands: { command: string; description: string }[]
): Promise<any> {
  return callTelegramAPI("setMyCommands", { commands });
}

export async function setChatMenuButton(
  webAppUrl: string,
  chatId?: number
): Promise<any> {
  const body: Record<string, any> = {
    menu_button: {
      type: "web_app",
      text: "Магазин",
      web_app: { url: webAppUrl },
    },
  };
  if (chatId) body.chat_id = chatId;
  return callTelegramAPI("setChatMenuButton", body);
}

export async function getFile(fileId: string): Promise<{ file_path?: string }> {
  const data = await callTelegramAPI("getFile", { file_id: fileId });
  return data?.result || {};
}

export function getFileUrl(filePath: string): string {
  return `https://api.telegram.org/file/bot${BOT_TOKEN()}/${filePath}`;
}
