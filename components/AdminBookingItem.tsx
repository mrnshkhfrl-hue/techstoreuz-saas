"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";

type BookingItemProps = {
  booking: {
    id: string;
    shopId: string;
    userId: string;
    usedProductId?: string | null;
    variantId?: string | null;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    expiresAt: string | Date;
    createdAt: string | Date;
    user?: {
      id: string;
      telegramId: string;
      name?: string | null;
      phone?: string | null;
      address?: string | null;
    } | null;
    usedProduct?: {
      id: string;
      title: string;
      price: number;
    } | null;
    variant?: {
      id: string;
      color: string;
      storage: string;
      price: number;
      templateId: string;
      template?: {
        id: string;
        title: string;
      } | null;
    } | null;
  };
};

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminBookingItem({ booking }: BookingItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  /* ── 1. Client Info ── */
  const clientName = booking.user?.name || `ID: ${booking.user?.telegramId || "—"}`;
  const rawPhone = booking.user?.phone || "Не указан";
  const clientPhone = rawPhone.replace(/^\+998\s*\+998/, "+998");
  const clientAddress = booking.user?.address || "Адрес не указан";

  /* ── 2. Product Title & Link URL ── */
  let productTitle = "Товар из каталога";
  let productIdForLink: string | null = null;
  let isUsedProduct = false;

  if (booking.usedProduct) {
    productTitle = booking.usedProduct.title;
    productIdForLink = booking.usedProduct.id;
    isUsedProduct = true;
  } else if (booking.variant) {
    const templateTitle = booking.variant.template?.title || "iPhone";
    productTitle = `${templateTitle} (${booking.variant.storage} · ${booking.variant.color})`;
    productIdForLink = booking.variant.templateId || booking.variant.id;
  } else if (booking.variantId) {
    productTitle = `Новый товар (ID: ${booking.variantId.substring(0, 8)})`;
    productIdForLink = booking.variantId;
  } else if (booking.usedProductId) {
    productTitle = `Б/У товар (ID: ${booking.usedProductId.substring(0, 8)})`;
    productIdForLink = booking.usedProductId;
    isUsedProduct = true;
  }

  const productUrl = productIdForLink
    ? `/?shopId=${booking.shopId}&productId=${productIdForLink}`
    : `/?shopId=${booking.shopId}`;

  const formattedDate = new Date(booking.expiresAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleUpdateStatus(action: "COMPLETE" | "CANCEL") {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          action,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Ошибка обновления статуса");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Ошибка сети при изменении статуса");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-5 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4 transition-all">
      {/* Client Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-glass-btn bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF] flex-shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white leading-tight truncate tracking-tight">
              {clientName}
            </p>
            <p className="text-[11px] text-white/30 font-mono mt-0.5">
              ID: {booking.user?.telegramId || "—"}
            </p>
          </div>
        </div>

        {/* Status pill */}
        {booking.status === "PENDING" && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex-shrink-0">
            Ожидает ⏳
          </span>
        )}
        {booking.status === ("CONFIRMED" as any) && (
          <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/20 border border-[#007AFF]/30 text-[#007AFF] text-[11px] font-bold flex-shrink-0">
            Активная бронь ⚡
          </span>
        )}
        {booking.status === "COMPLETED" && (
          <span className="px-2.5 py-1 rounded-full bg-[#34C759]/20 border border-[#34C759]/30 text-[#34C759] text-[11px] font-bold flex-shrink-0">
            Куплено ✅
          </span>
        )}
        {booking.status === "CANCELLED" && (
          <span className="px-2.5 py-1 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30]/30 text-[#FF3B30] text-[11px] font-bold flex-shrink-0">
            Отменено ❌
          </span>
        )}
      </div>

      {/* Client Contact & Actions */}
      <div className="flex items-center gap-2 pt-1">
        {clientPhone && clientPhone !== "Не указан" && (
          <a
            href={`tel:${clientPhone}`}
            className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Phone size={12} className="text-[#34C759]" />
            <span>Позвонить ({clientPhone})</span>
          </a>
        )}

        {rawPhone && rawPhone.replace(/[^\d]/g, "") && (
          <a
            href={`https://t.me/+${rawPhone.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-[#007AFF]/20 hover:bg-[#007AFF]/30 border border-[#007AFF]/30 text-[#2997FF] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Написать в TG</span>
          </a>
        )}
      </div>

      {/* Product Title & Link */}
      <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex items-center justify-between gap-3">
        <Link
          href={productUrl}
          className="group flex items-center gap-2 min-w-0 flex-1"
        >
          <span className="text-[13px] font-bold text-[#007AFF] group-hover:text-[#0A84FF] transition-colors truncate">
            {productTitle}
          </span>
          <ExternalLink size={13} className="text-[#007AFF] flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>
        <span
          className={`px-2.5 py-1 rounded-glass-xs text-[10px] font-extrabold uppercase flex-shrink-0 ${
            isUsedProduct
              ? "bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/25"
              : "bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/25"
          }`}
        >
          {isUsedProduct ? "Б/У" : "Новый"}
        </span>
      </div>

      {/* Timer expiration */}
      <div className="flex items-center gap-2 text-xs font-medium text-white/40 px-1">
        <Clock size={14} className="text-[#FF9500]" />
        <span>Удержание до: {formattedDate}</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={tapSpring}
          disabled={isLoading || (booking.status !== "PENDING" && (booking.status as any) !== "CONFIRMED")}
          onClick={() => handleUpdateStatus("COMPLETE")}
          className={`
            py-3 px-3 rounded-glass-btn text-[12px] font-bold flex items-center justify-center gap-1.5 backdrop-blur-xl
            transition-all
            ${
              booking.status === "COMPLETED"
                ? "bg-[#34C759]/10 text-[#34C759]/40 border border-[#34C759]/15 cursor-not-allowed"
                : booking.status === "PENDING" || (booking.status as any) === "CONFIRMED"
                ? "bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30 hover:bg-[#34C759]/30 cursor-pointer"
                : "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
            }
            ${isLoading ? "opacity-50 cursor-wait" : ""}
          `}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Куплено (Завершить)
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={tapSpring}
          disabled={isLoading || (booking.status !== "PENDING" && (booking.status as any) !== "CONFIRMED")}
          onClick={() => handleUpdateStatus("CANCEL")}
          className={`
            py-3 px-3 rounded-glass-btn text-[12px] font-bold flex items-center justify-center gap-1.5 backdrop-blur-xl
            transition-all
            ${
              booking.status === "CANCELLED"
                ? "bg-[#FF3B30]/10 text-[#FF3B30]/40 border border-[#FF3B30]/15 cursor-not-allowed"
                : booking.status === "PENDING" || (booking.status as any) === "CONFIRMED"
                ? "bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30 hover:bg-[#FF3B30]/30 cursor-pointer"
                : "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
            }
            ${isLoading ? "opacity-50 cursor-wait" : ""}
          `}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          Отменить бронь
        </motion.button>
      </div>
    </div>
  );
}
