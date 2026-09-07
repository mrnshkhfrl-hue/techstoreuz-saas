import { prisma } from "./prisma";
import crypto from "crypto";

const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_IDS || process.env.ADMIN_CHAT_IDS || "8603067434,7949519588")
  .split(",").map(s => s.trim()).filter(Boolean);

const SUPERADMIN_IDS = (process.env.SUPERADMIN_IDS || process.env.NEXT_PUBLIC_SUPERADMIN_IDS || "7949519588,8603067434")
  .split(",").map(s => s.trim()).filter(Boolean);

export function validateInitData(initData: string): any {
  if (!initData) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const rawToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "8426826305:AAFOLp579bWZpwGZuYJyo1KDy36DM8WD3c8";
    const cleanToken = rawToken.replace(/^["']|["']$/g, '').trim();
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(cleanToken).digest();
    const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (computedHash !== hash) return null;

    const userStr = urlParams.get("user");
    if (!userStr) return null;

    const authDateStr = urlParams.get("auth_date");
    if (!authDateStr) return null;

    const authDate = parseInt(authDateStr, 10);
    const now = Math.floor(Date.now() / 1000);
    
    // Reject if older than 24 hours (86400 seconds)
    if (now - authDate > 86400) {
      console.warn("InitData expired (replay attack prevention)");
      return null;
    }

    // Tolerance for clock skew: allow tokens from up to 5 minutes in the future
    if (authDate - now > 300) {
      console.warn("InitData from too far in the future (clock skew anomaly)");
      return null;
    }

    return JSON.parse(userStr);
  } catch (error) {
    console.error("InitData validation failed", error);
    return null;
  }
}

export async function isAdmin(initData: string | null) {
  if (!initData) return false;
  
  const user = validateInitData(initData);
  if (!user || !user.id) return false;

  // Superadmins are always admins
  if (SUPERADMIN_IDS.includes(String(user.id))) return true;

  // Check if matches the hardcoded ADMIN_IDS from .env
  if (ADMIN_IDS.includes(String(user.id))) return true;

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: String(user.id) }
  });
  if (!dbUser) return false;

  const admin = await prisma.shopAdmin.findFirst({
    where: { userId: dbUser.id }
  });
  return !!admin;
}

export async function isSuperAdmin(initData: string | null) {
  if (!initData) return false;

  const user = validateInitData(initData);
  if (!user || !user.id) return false;

  return SUPERADMIN_IDS.includes(String(user.id));
}

export async function isOwner(initData: string | null) {
  if (!initData) return false;

  const user = validateInitData(initData);
  if (!user || !user.id) return false;

  // Superadmins are owners
  if (SUPERADMIN_IDS.includes(String(user.id))) return true;

  // Check if matches the hardcoded Owner (first in ADMIN_IDS)
  if (ADMIN_IDS[0] === String(user.id)) return true;

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: String(user.id) }
  });
  if (!dbUser) return false;

  const admin = await prisma.shopAdmin.findFirst({
    where: { userId: dbUser.id }
  });
  return admin?.role === "OWNER";
}

export async function getAdminContext(initData: string | null, requestedShopId: string | null = null) {
  if (!initData) return { isAuthorized: false, isSuperAdmin: false, shopId: null };

  const user = validateInitData(initData);
  if (!user || !user.id) return { isAuthorized: false, isSuperAdmin: false, shopId: null };

  const telegramId = String(user.id);
  const isSuper = SUPERADMIN_IDS.includes(telegramId);
  
  if (isSuper) {
    // SuperAdmin respects the requestedShopId if provided, otherwise global access
    return { isAuthorized: true, isSuperAdmin: true, shopId: requestedShopId };
  }

  const dbUser = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (dbUser) {
    const admin = await prisma.shopAdmin.findFirst({
      where: { userId: dbUser.id }
    });

    if (admin) {
      // Normal admin ignores requestedShopId and is strictly bound to their own shop
      return { isAuthorized: true, isSuperAdmin: false, shopId: admin.shopId };
    }
  }

  // Legacy fallback if admin is in NEXT_PUBLIC_ADMIN_IDS but not in DB
  if (ADMIN_IDS.includes(telegramId)) {
    return { isAuthorized: true, isSuperAdmin: false, shopId: null }; 
  }

  return { isAuthorized: false, isSuperAdmin: false, shopId: null };
}

export function getUserIdFromInitData(initData: string | null): number | null {
  if (!initData) return null;
  const user = validateInitData(initData);
  return user ? Number(user.id) : null;
}
