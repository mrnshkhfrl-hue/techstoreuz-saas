"use client";

import React from "react";
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
} from "lucide-react";
import { DbUser } from "@/hooks/useTelegramAuth";

interface BookingsTabProps {
  user: DbUser | null;
  isDark: boolean;
  lang: "RU" | "UZ";
  currency: "USD" | "UZS";
  currencyRate: number;
  onNavigateToUsed: () => void;
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
            {lang === "RU" ? "Подтверждено" : "Tasdiqlandi"}
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
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/25 flex items-center gap-1">
            <Clock size={12} />
            {lang === "RU" ? "Ожидает в филиале" : "Filialda kutmoqda"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Title */}
      <div className="px-1">
        <h2 className={`text-[20px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
          {lang === "RU" ? "Мои бронирования" : "Mening bandlovlarim"}
        </h2>
        <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
          {lang === "RU"
            ? "Устройства, забронированные на ваше имя в филиалах магазина"
            : "Do'kon filiallarida nomingizga band qilingan qurilmalar"}
        </p>
      </div>

      {bookings.length === 0 ? (
        /* Empty State */
        <div
          className={`
            p-8 rounded-[24px] text-center flex flex-col items-center justify-center space-y-4
            ${d ? "bg-white/[0.03] border-white/10" : "bg-white border-black/10 shadow-sm"}
            border backdrop-blur-xl
          `}
        >
          <div className="w-16 h-16 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
            <Bookmark size={28} />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className={`text-[16px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
              {lang === "RU" ? "Нет активных броней" : "Hozircha bandlovlar yo'q"}
            </h3>
            <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"} leading-relaxed`}>
              {lang === "RU"
                ? "Вы можете забронировать любое проверенное Б/У устройство на 24 часа без предоплаты и проверить его в магазине."
                : "Har qanday tekshirilgan B/U qurilmani 24 soatga oldindan to'lovsiz band qilib, do'konda ko'rishingiz mumkin."}
            </p>
          </div>
          <button
            onClick={onNavigateToUsed}
            className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-md shadow-[#007AFF]/25 hover:bg-[#007AFF]/90 transition-all cursor-pointer"
          >
            <span>{lang === "RU" ? "Выбрать Б/У устройство" : "B/U qurilma tanlash"}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-3">
          {bookings.map((booking: any) => {
            const title =
              booking.usedProduct?.title ||
              booking.variant?.template?.title ||
              "Устройство Apple";
            const price =
              booking.usedProduct?.price ||
              booking.variant?.price ||
              booking.variant?.template?.basePrice ||
              0;
            const battery = booking.usedProduct?.batteryHealth;
            const region = booking.usedProduct?.region;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  p-4 rounded-[22px] border transition-all space-y-3
                  ${
                    d
                      ? "bg-white/[0.04] border-white/10 hover:border-white/15"
                      : "bg-white border-black/10 shadow-sm hover:border-black/15"
                  }
                  backdrop-blur-xl
                `}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`text-[15px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                      {title}
                    </h3>
                    <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"} mt-0.5`}>
                      {lang === "RU" ? "Бронь от" : "Band qilingan sana"}{" "}
                      {new Date(booking.createdAt).toLocaleDateString(
                        lang === "RU" ? "ru-RU" : "uz-UZ"
                      )}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Characteristics Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {battery && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/80" : "bg-black/5 text-[#1C1C1E]/80"}`}>
                      🔋 {battery}% АКБ
                    </span>
                  )}
                  {region && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/80" : "bg-black/5 text-[#1C1C1E]/80"}`}>
                      🌍 {region}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#007AFF] px-2 py-0.5 rounded-lg bg-[#007AFF]/10">
                    {formatPrice(price)}
                  </span>
                </div>

                {/* Pickup Location & Contact Info */}
                <div
                  className={`p-3 rounded-xl border text-[12px] space-y-1.5 ${
                    d ? "bg-white/[0.02] border-white/5 text-white/70" : "bg-black/[0.02] border-black/5 text-[#1C1C1E]/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#FF2D55] shrink-0" />
                    <span className="font-medium">
                      {lang === "RU"
                        ? "Филиал: г. Самарканд, ул. Гульабад, 1"
                        : "Filial: Samarqand sh., Gulobod ko'chasi, 1"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-[#34C759] shrink-0" />
                      <span className="font-mono text-[11px]">
                        {user?.phone || "+998 77 285-99-99"}
                      </span>
                    </div>
                    <a
                      href="tel:+998772859999"
                      className="text-[#007AFF] font-bold text-[11px] hover:underline"
                    >
                      {lang === "RU" ? "Позвонить" : "Qo'ng'iroq"}
                    </a>
                  </div>
                </div>

                {/* Action / Help Notice */}
                <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"} text-center`}>
                  {lang === "RU"
                    ? "Устройство забронировано на 24 часа. Оплата при получении."
                    : "Qurilma 24 soatga band qilingan. To'lov qabul qilinganda."}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
