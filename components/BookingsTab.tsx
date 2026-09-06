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
  MessageCircle,
} from "lucide-react";
import { DbUser } from "@/hooks/useTelegramAuth";
import { getModelPhoto, extractStorage } from "@/lib/product-images";

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
  // Bookings are strictly for USED devices. New devices are orders, not bookings!
  const bookings = (user?.bookings || []).filter(
    (b: any) => Boolean(b.usedProductId || b.usedProduct)
  );

  const formatPrice = (priceUsd: number) => {
    if (currency === "UZS") {
      const uzs = Math.round(priceUsd * currencyRate);
      return `${uzs.toLocaleString("ru-RU")} сум`;
    }
    return `$${priceUsd.toLocaleString("en-US")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
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
            {lang === "RU" ? "На рассмотрении" : "Ko'rib chiqilmoqda"}
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
          <div className="w-16 h-16 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/25 flex items-center justify-center text-[#2997FF] shadow-lg shadow-blue-500/15">
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#0071E3] hover:from-[#2997FF] hover:to-[#0A84FF] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 border border-white/20 transition-all cursor-pointer active:scale-[0.97]"
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
            const storage = booking.variant?.storage || extractStorage(title);
            const photoUrl = getModelPhoto(title);
            const isPending = booking.status === "PENDING";
            const isCompleted = booking.status === "COMPLETED";

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
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-[15px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {title}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"} mt-0.5`}>
                      {lang === "RU" ? "Бронь от" : "Band qilingan sana"}{" "}
                      {new Date(booking.createdAt).toLocaleDateString(
                        lang === "RU" ? "ru-RU" : "uz-UZ"
                      )}
                    </p>
                    <p className={`text-[17px] font-black tracking-tight mt-1 ${d ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.12)]" : "text-[#1C1C1E]"}`}>
                      {formatPrice(price)}
                    </p>
                  </div>
                </div>

                {/* Characteristics Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${d ? "bg-white/5 text-white/80" : "bg-black/5 text-[#1C1C1E]/80"}`}>
                    💾 {storage}
                  </span>
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
                </div>

                {/* Status Notice Banner */}
                <div className={`p-2.5 rounded-xl border text-[12px] flex items-start gap-2 ${
                  isPending
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : d ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-[#1C1C1E]/60"
                }`}>
                  <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {isPending
                      ? (lang === "RU"
                          ? "Заявка отправлена администратору. Менеджер свяжется с вами по телефону для подтверждения!"
                          : "So'rov adminga yuborildi. Menejer tasdiqlash uchun telefon orqali bog'lanadi!")
                      : isCompleted
                      ? (lang === "RU"
                          ? "Бронь подтверждена! Устройство ждет вас в филиале в течение 24 часов."
                          : "Bandlov tasdiqlandi! Qurilma filialda 24 soat davomida sizni kutadi.")
                      : (lang === "RU" ? "Бронирование завершено или отменено." : "Bandlov yakunlandi yoki bekor qilindi.")}
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
                        ? "г. Самарканд, ул. Гульабад, 1"
                        : "Samarqand sh., Gulobod ko'chasi, 1"}
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
                      href="https://t.me/mrnshkx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2997FF] hover:text-[#0A84FF] font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle size={12} />
                      <span>{lang === "RU" ? "Спросить менеджера" : "Menejerdan so'rash"}</span>
                    </a>
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
