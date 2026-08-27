'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Store, 
  Layers, 
  Clock
} from 'lucide-react';

export default function RootRouter() {
  const { user, isReady, haptic } = useTelegram();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SuperAdmin IDs list from env or fallback
  const isSuperAdmin = useMemo(() => {
    if (!user?.telegramId) return false;
    
    const superAdminRaw = 
      process.env.NEXT_PUBLIC_SUPERADMIN_IDS || 
      process.env.NEXT_PUBLIC_ADMIN_IDS || 
      "7949519588,8603067434";

    const superAdminIds = superAdminRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return superAdminIds.includes(String(user.telegramId));
  }, [user?.telegramId]);

  if (!mounted || !isReady) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-black text-white flex items-center justify-center p-6 sm:border-x border-white/5">
        <div className="p-6 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] flex items-center gap-3 shadow-2xl">
          <div className="w-5 h-5 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
          <span className="text-sm text-white/70 font-semibold tracking-wide">Загрузка платформы...</span>
        </div>
      </div>
    );
  }

  // ── VIEW 1: SUPERADMIN / OWNER ──────────────────────────────────────────
  if (isSuperAdmin) {
    return (
      <div className="relative max-w-[430px] mx-auto min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:border-x border-white/5 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#007AFF]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-[#5856D6]/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Top Header Tag */}
        <div className="relative z-10 pt-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">SaaS Platform</span>
          </div>
          {user?.username && (
            <span className="text-xs text-white/50 font-medium">@{user.username}</span>
          )}
        </div>

        {/* Central Liquid Glass Card */}
        <div className="relative z-10 my-auto py-6">
          <div className="p-7 rounded-[32px] bg-white/[0.04] backdrop-blur-3xl border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] text-center relative overflow-hidden">
            {/* Edge highlight reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {/* Glowing Shield Icon */}
            <div className="w-20 h-20 rounded-[26px] bg-gradient-to-b from-[#007AFF]/25 to-[#007AFF]/5 border border-[#007AFF]/40 flex items-center justify-center mx-auto mb-5 shadow-[0_0_35px_rgba(0,122,255,0.3)]">
              <ShieldCheck className="w-10 h-10 text-[#007AFF]" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/30 text-[#5AC8FA] text-[11px] font-bold tracking-wide uppercase mb-3">
              Режим Владельца
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              Добро пожаловать, Владелец!
            </h1>
            
            <p className="text-white/60 text-sm leading-relaxed mb-6 font-normal">
              Вы находитесь на платформе управления магазинами. Здесь вы можете создавать новые филиалы, загружать товары и управлять заказами.
            </p>

            <div className="space-y-3">
              <Link
                href="/superadmin"
                onClick={() => haptic?.impactOccurred('medium')}
                className="w-full py-4 px-6 rounded-[20px] bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all cursor-pointer"
              >
                <Layers className="w-5 h-5" />
                <span>Перейти в панель управления</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 pb-4 text-center">
          <p className="text-[11px] text-white/30 tracking-wide font-medium">
            Techstoreuz B2B SaaS Architecture • v1.0
          </p>
        </div>
      </div>
    );
  }

  // ── VIEW 2: REGULAR CUSTOMER ───────────────────────────────────────────
  return (
    <div className="relative max-w-[430px] mx-auto min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:border-x border-white/5 overflow-hidden">
      {/* Subtle ambient backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/[0.03] rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-60 h-60 bg-[#007AFF]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 pt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <Store className="w-3.5 h-3.5 text-[#007AFF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">Витрина</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 my-auto py-6">
        <div className="p-8 rounded-[32px] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] text-center relative overflow-hidden">
          {/* Glass Top Reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-[26px] bg-white/[0.05] border border-white/15 flex items-center justify-center mx-auto mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <Sparkles className="w-10 h-10 text-[#007AFF]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/70 text-[11px] font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-white/50" />
            <span>Скоро открытие</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2.5">
            Магазин на стадии оформления
          </h2>

          <p className="text-white/50 text-sm leading-relaxed font-normal">
            Мы настраиваем витрину и скоро откроем доступ к лучшим ценам, каталогу и Trade-in калькулятору. Пожалуйста, загляните чуть позже!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-4 text-center">
        <p className="text-[11px] text-white/30 tracking-wide font-medium">
          {process.env.NEXT_PUBLIC_STORE_NAME || "Techstoreuz"}
        </p>
      </div>
    </div>
  );
}
