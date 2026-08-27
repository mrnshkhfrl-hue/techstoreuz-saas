"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";

export default function SuperAdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useTelegram();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait until Telegram SDK is ready
    if (!isReady) return;

    try {
      const superAdminRaw = 
        process.env.NEXT_PUBLIC_SUPERADMIN_IDS || 
        process.env.NEXT_PUBLIC_ADMIN_IDS || 
        process.env.SUPERADMIN_IDS || 
        process.env.ADMIN_CHAT_IDS || 
        "7949519588,8603067434";

      const superAdminIds = superAdminRaw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      // 1. Try from useTelegram hook
      const userId = user?.telegramId || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (userId && superAdminIds.includes(String(userId))) {
        setIsAuthorized(true);
        return;
      }

      // If localhost / dev mode
      if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        setIsAuthorized(true);
        return;
      }

      if (userId) {
        // User ID is known but not in superadmin list
        setIsAuthorized(false);
      } else {
        // If outside Telegram or no user data attached
        setIsAuthorized(false);
      }
    } catch (e) {
      console.error("SuperAdmin Auth error:", e);
      setIsAuthorized(false);
    }
  }, [user, isReady]);

  if (!isReady || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="p-6 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
          <span className="text-sm text-white/60 font-semibold tracking-wide">Проверка доступа...</span>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    const currentId = user?.telegramId || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "Не определен";
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
        <div className="p-8 max-w-sm w-full rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/25 flex items-center justify-center mx-auto text-[#FF3B30] text-xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Доступ запрещен</h1>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Эта страница доступна только создателю платформы (Супер-админу).
          </p>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-white/40 font-mono">
            Ваш ID: {currentId}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
