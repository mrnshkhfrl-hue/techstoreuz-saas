"use client";

import { useEffect, useState } from "react";

export default function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initDataUnsafe;
      
      if (!initData || !initData.user) {
        setIsAuthorized(false);
        return;
      }

      const userId = initData.user.id;
      const adminIds = (process.env.NEXT_PUBLIC_ADMIN_IDS || "").split(",").map(s => s.trim());
      
      if (adminIds.includes(String(userId))) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (e) {
      console.error("Auth error:", e);
      setIsAuthorized(false);
    }
  }, []);

  if (isAuthorized === null) {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
        <div className="p-8 max-w-sm w-full rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/25 flex items-center justify-center mx-auto text-[#FF3B30] text-xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Доступ запрещен</h1>
          <p className="text-xs text-white/50 leading-relaxed">Эта страница доступна только администраторам через Telegram Mini App.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
