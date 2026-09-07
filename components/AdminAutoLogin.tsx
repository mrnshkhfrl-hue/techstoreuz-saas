"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

export default function AdminAutoLogin() {
  const [status, setStatus] = useState<"checking" | "redirecting" | "denied" | "not_in_telegram">("checking");
  const [detectedId, setDetectedId] = useState<string | null>(null);

  useEffect(() => {
    const adminIds = [
      process.env.NEXT_PUBLIC_ADMIN_IDS,
      process.env.NEXT_PUBLIC_SUPERADMIN_IDS,
      "8603067434",
      "7949519588",
    ]
      .filter(Boolean)
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Check localhost dev mode
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      window.location.replace("/admin?adminId=7949519588");
      return;
    }

    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    const tgUser = tg?.initDataUnsafe?.user;
    const currentId = tgUser?.id ? String(tgUser.id) : null;

    if (currentId) {
      setDetectedId(currentId);
      if (adminIds.includes(currentId)) {
        setStatus("redirecting");
        window.location.replace(`/admin?adminId=${currentId}`);
        return;
      } else {
        setStatus("denied");
        return;
      }
    }

    // Try checking again for up to 1.5 seconds if Telegram WebApp takes time to initialize
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const lateUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const lateId = lateUser?.id ? String(lateUser.id) : null;

      if (lateId) {
        clearInterval(interval);
        setDetectedId(lateId);
        if (adminIds.includes(lateId)) {
          setStatus("redirecting");
          window.location.replace(`/admin?adminId=${lateId}`);
        } else {
          setStatus("denied");
        }
        return;
      }

      if (count >= 15) {
        clearInterval(interval);
        setStatus("not_in_telegram");
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (status === "checking" || status === "redirecting") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-8 max-w-sm w-full rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#2997FF]/30 border-t-[#2997FF] animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              {status === "redirecting" ? "Вход в панель управления..." : "Проверка прав администратора..."}
            </h2>
            <p className="text-xs text-white/50">Авторизация через Telegram</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-sm w-full p-8 rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Доступ запрещен</h1>
            <p className="text-xs text-white/50 leading-relaxed">
              Ваш Telegram аккаунт не зарегистрирован как администратор этого магазина.
            </p>
          </div>
          {detectedId && (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-white/40 font-mono">
              Telegram ID: {detectedId}
            </div>
          )}
          <a
            href="/"
            className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
          >
            ← Перейти в магазин
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2997FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-sm w-full p-8 rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#2997FF]/15 border border-[#2997FF]/25 flex items-center justify-center mx-auto text-[#2997FF]">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white tracking-tight">Требуется Telegram</h1>
          <p className="text-xs text-white/50 leading-relaxed">
            Панель управления защищена и доступна только авторизованным администраторам через Telegram Mini App.
          </p>
        </div>
        <a
          href="https://t.me/techstore_uzbot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl bg-[#2997FF] hover:bg-[#2997FF]/90 text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
        >
          <span>Открыть в Telegram</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
