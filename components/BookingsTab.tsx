"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { DbUser } from "@/hooks/useTelegramAuth";
import { getModelPhoto, extractStorage } from "@/lib/product-images";
import { STORE_MANAGERS, STORE_TELEGRAM } from "@/lib/device-specs";

interface BookingsTabProps {
  user: DbUser | null;
  isDark: boolean;
  lang: "RU" | "UZ";
  currency: "USD" | "UZS";
  currencyRate: number;
  onNavigateToUsed: () => void;
}

function useCountdown(expiresAt: string | Date | undefined) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return timeLeft;
}

function CountdownBadge({ expiresAt, lang }: { expiresAt: string | Date | undefined; lang: "RU" | "UZ" }) {
  const { hours, minutes, seconds, isExpired } = useCountdown(expiresAt);

  if (isExpired) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
        {lang === "RU" ? "Время истекло" : "Vaqt tugadi"}
      </span>
    );
  }

  return (
    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 font-mono">
      <Clock size={11} className="animate-pulse" />
      <span>{hours}h {minutes}m {seconds}s</span>
    </span>
  );
}

export default function BookingsTab({
  user,
  isDark,
  lang,
  currency,
  currencyRate,
  onNavigateToUsed,
}: BookingsTabProps) {
  const d = isDark;
  // Support all booked items (both new and used)
  const bookings = user?.bookings || [];

  const formatPrice = (priceUsd: number) => {
    if (currency === "UZS") {
      const uzs = Math.round(priceUsd * currencyRate);
      return `${uzs.toLocaleString("ru-RU")} сум`;
    }
    return `$${priceUsd.toLocaleString("en-US")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/25 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {lang === "RU" ? "Забронировано на 24ч" : "24 soatga band qilindi"}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#2997FF]/15 text-[#2997FF] border border-[#2997FF]/25 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {lang === "RU" ? "Выкуплено в магазине" : "Do'konda sotib olindi"}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/25 flex items-center gap-1">
            <AlertCircle size={12} />
            {lang === "RU" ? "Отменено" : "Bekor qilindi"}
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/25 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {lang === "RU" ? "Забронировано на 24ч" : "24 soatga band qilindi"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Title */}
      <div className="px-1">
        <h2 className={`text-[20px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
          {lang === "RU" ? "Мои бронирования" : "Mening bandlovlarim"}
        </h2>
        <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
          {lang === "RU"
            ? "Устройства, закрепленные за вами на 24 часа без предоплаты"
            : "Oldindan to'lovsiz 24 soatga nomingizga biriktirilgan qurilmalar"}
        </p>
      </div>

      {bookings.length === 0 ? (
        /* Empty State */
        <div
          className={`
            p-8 rounded-[28px] text-center flex flex-col items-center justify-center space-y-4
            ${d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"}
            border backdrop-blur-2xl relative overflow-hidden
          `}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0A84FF]/20 to-[#2997FF]/20 border border-[#0A84FF]/30 flex items-center justify-center text-[#2997FF] shadow-lg shadow-blue-500/15">
            <Bookmark size={28} />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className={`text-[16px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
              {lang === "RU" ? "Нет активных броней" : "Hozircha bandlovlar yo'q"}
            </h3>
            <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"} leading-relaxed`}>
              {lang === "RU"
                ? "Вы можете забронировать любое устройство из каталога на 24 часа. Товар закрепляется за вами сразу, без ожидания подтверждения!"
                : "Katalogdan istalgan qurilmani 24 soatga band qilishingiz mumkin. Mahsulot darhol sizga biriktiriladi!"}
            </p>
          </div>
          <button
            onClick={onNavigateToUsed}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-[0_4px_16px_rgba(10,132,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)] border border-white/20 transition-all cursor-pointer active:scale-[0.97]"
          >
            <span>{lang === "RU" ? "Открыть каталог" : "Katalogni ochish"}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-3">
          {bookings.map((booking: any) => {
            const isUsed = Boolean(booking.usedProductId || booking.usedProduct);
            const title =
              booking.usedProduct?.title ||
              booking.variant?.template?.title ||
              "Apple iPhone";
            const price =
              booking.usedProduct?.price ||
              booking.variant?.price ||
              booking.variant?.template?.basePrice ||
              0;
            const battery = booking.usedProduct?.batteryHealth;
            const region = booking.usedProduct?.region || "ZP/A";
            const storage = booking.variant?.storage || extractStorage(title);
            const photoUrl = getModelPhoto(title);
            const isConfirmed = booking.status === "CONFIRMED" || booking.status === "PENDING";

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  p-4 rounded-[26px] border transition-all space-y-3.5 relative overflow-hidden
                  ${
                    d
                      ? "bg-white/[0.04] border-white/10 hover:border-white/20 shadow-xl"
                      : "bg-white border-black/10 shadow-sm hover:border-black/20"
                  }
                  backdrop-blur-2xl
                `}
              >
                {/* Header Row with Photo and Title */}
                <div className="flex items-start gap-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${d ? "bg-white/5 border border-white/5" : "bg-black/5 border border-black/5"}`}>
                    <img
                      src={photoUrl}
                      alt={title}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        e.currentTarget.src = "/products/iphone15pro_1.webp";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <h3 className={`text-[15px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {title}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                        {isUsed ? (lang === "RU" ? "Б/У • Идеальное" : "B/U • Ideal") : (lang === "RU" ? "Новый • Запечатан" : "Yangi • Qutida")}
                      </p>
                      {isConfirmed && (
                        <CountdownBadge expiresAt={booking.expiresAt} lang={lang} />
                      )}
                    </div>

                    <p className={`text-[17px] font-black tracking-tight mt-1.5 ${d ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.12)]" : "text-[#1C1C1E]"}`}>
                      {formatPrice(price)}
                    </p>
                  </div>
                </div>

                {/* Characteristics Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/80 border border-white/5" : "bg-black/5 text-[#1C1C1E]/80 border border-black/5"}`}>
                    💾 {storage}
                  </span>
                  {battery ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      🔋 {battery}% АКБ
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      🔋 100% АКБ (Новый)
                    </span>
                  )}
                  {region && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/70" : "bg-black/5 text-[#1C1C1E]/70"}`}>
                      🌍 Region {region}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/70" : "bg-black/5 text-[#1C1C1E]/70"}`}>
                    📦 {lang === "RU" ? "Коробка есть" : "Qutisi bor"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#2997FF]/15 text-[#2997FF] border border-[#2997FF]/20">
                    📝 {lang === "RU" ? "Гарантия магазина" : "Do'kon kafolati"}
                  </span>
                </div>

                {/* Immediate Hold Notice Banner */}
                <div className={`p-3 rounded-2xl border text-[12px] flex items-start gap-2.5 ${
                  isConfirmed
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                    : d ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-[#1C1C1E]/60"
                }`}>
                  <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div className="space-y-0.5 leading-snug">
                    <p className="font-bold text-[12px]">
                      {lang === "RU" ? "🟢 Бронь закреплена за вами!" : "🟢 Bandlov sizga biriktirildi!"}
                    </p>
                    <p className="text-[11px] opacity-90">
                      {lang === "RU"
                        ? "Устройство отложено на 24 часа. Товар снят с открытой витрины. Приезжайте в филиал и забирайте без очередей и без предоплаты."
                        : "Qurilma 24 soatga olib qo'yildi va vitrinadan yopildi. Filialga kelib, navbatsiz va oldindan to'lovsiz olib ketishingiz mumkin."}
                    </p>
                  </div>
                </div>

                {/* Pickup Location & Manager Contacts */}
                <div
                  className={`p-3.5 rounded-2xl border text-[12px] space-y-2.5 ${
                    d ? "bg-white/[0.02] border-white/5 text-white/80" : "bg-black/[0.02] border-black/5 text-[#1C1C1E]/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#FF2D55] shrink-0" />
                    <span className="font-medium text-[11.5px]">
                      {lang === "RU"
                        ? "Филиал: г. Самарканд, ул. Гульабад, 1"
                        : "Filial: Samarqand sh., Gulobod ko'chasi, 1"}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                        {lang === "RU" ? "Контакты для связи:" : "Bog'lanish uchun:"}
                      </span>
                      <a
                        href={STORE_TELEGRAM}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#2997FF] hover:underline flex items-center gap-1"
                      >
                        <MessageCircle size={11} />
                        <span>@Prostoreuzb</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {STORE_MANAGERS.slice(0, 2).map((m) => (
                        <a
                          key={m.name}
                          href={`tel:${m.phone}`}
                          className={`p-1.5 px-2 rounded-xl border flex items-center justify-between text-[11px] font-semibold transition-all ${
                            d ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400">{m.displayPhone}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
