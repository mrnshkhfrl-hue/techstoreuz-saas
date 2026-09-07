"use client";

import { useEffect, useState } from "react";
import { useTelegram, extractTelegramUser } from "@/hooks/useTelegram";

export default function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useTelegram();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [detectedId, setDetectedId] = useState<string | null>(null);

  useEffect(() => {
    // Localhost bypass for dev
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      setIsAuthorized(true);
      return;
    }

    const adminRaw = [
      process.env.NEXT_PUBLIC_ADMIN_IDS,
      process.env.NEXT_PUBLIC_SUPERADMIN_IDS,
      process.env.ADMIN_CHAT_IDS,
      process.env.SUPERADMIN_IDS,
      "8603067434,7949519588"
    ].filter(Boolean).join(",");

    const adminIds = adminRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const getCandidateId = (): string | null => {
      if (typeof window === "undefined") return null;

      // 1. Check URL query parameters (adminId, tgId, userId)
      try {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get("adminId") || params.get("tgId") || params.get("userId");
        if (qId && qId.trim()) return qId.trim();
      } catch {}

      // 2. Check extracted Telegram user
      const extracted = user || extractTelegramUser();
      if (extracted?.telegramId) return String(extracted.telegramId);

      // 3. Check direct Telegram WebApp object
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) return String(tgUser.id);

      // 4. Check cached admin ID in sessionStorage
      try {
        const cachedAdminId = sessionStorage.getItem("admin_auth_id");
        if (cachedAdminId && cachedAdminId.trim()) return cachedAdminId.trim();
      } catch {}

      return null;
    };

    const checkAuth = () => {
      const currentId = getCandidateId();

      if (currentId) {
        setDetectedId(currentId);
        if (adminIds.includes(currentId)) {
          try {
            sessionStorage.setItem("admin_auth_id", currentId);
          } catch {}
          setIsAuthorized(true);
          return true;
        }
      }
      return false;
    };

    if (checkAuth()) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (checkAuth()) {
        clearInterval(interval);
        return;
      }
      if (attempts >= 20) {
        clearInterval(interval);
        const finalCandidate = getCandidateId();
        if (finalCandidate) setDetectedId(finalCandidate);
        setIsAuthorized(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user, isReady]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="p-6 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
          <span className="text-sm text-white/60 font-semibold tracking-wide">Проверка прав администратора...</span>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    const finalId =
      detectedId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("adminId") ||
          new URLSearchParams(window.location.search).get("tgId") ||
          new URLSearchParams(window.location.search).get("userId")
        : null) ||
      user?.telegramId ||
      extractTelegramUser()?.telegramId ||
      "Не определен";
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
        <div className="p-8 max-w-sm w-full rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/25 flex items-center justify-center mx-auto text-[#FF3B30] text-xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Доступ запрещен</h1>
          <p className="text-xs text-white/50 leading-relaxed">Эта страница доступна только администраторам через Telegram Mini App.</p>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-white/40 font-mono">
            Ваш ID: {finalId}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
