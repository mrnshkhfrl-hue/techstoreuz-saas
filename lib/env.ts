// White-label environment configuration
// All store-specific settings are controlled via .env variables

const requiredVars = [
  "NEXT_PUBLIC_STORE_NAME",
  "NEXT_PUBLIC_BOT_USERNAME",
  "ADMIN_CHAT_IDS",
] as const;

const optionalVars = [
  "NEXT_PUBLIC_STORE_CURRENCY",
  "NEXT_PUBLIC_CONTACT_PHONE",
  "NEXT_PUBLIC_CONTACT_INSTAGRAM",
  "NEXT_PUBLIC_CONTACT_TELEGRAM",
  "TELEGRAM_BOT_TOKEN",
] as const;

function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.error(
      `\n❌ [ENV ERROR] Missing required environment variables:\n` +
      missing.map(k => `   - ${k}`).join("\n") +
      `\n\nPlease add them to your .env file or Vercel project settings.\n`
    );
  }
}

// Run validation on import (both server & client)
if (typeof process !== "undefined") {
  validateEnv();
}

/** Store display name */
export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Store";

/** Default currency symbol */
export const STORE_CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || "UZS";

/** Contact phone shown in UI (e.g. "+998901234567") */
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";

/** Instagram link */
export const CONTACT_INSTAGRAM = process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM || "";

/** Telegram channel/group link */
export const CONTACT_TELEGRAM = process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || "";

/** Bot username for deep links */
export const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || "";

/** Parsed admin Telegram IDs (server-side only) */
export function getAdminIds(): number[] {
  const raw = process.env.ADMIN_CHAT_IDS || "";
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => !isNaN(n));
}
