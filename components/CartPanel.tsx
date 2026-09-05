"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ChevronUp,
  Clock,
  Trash2,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

export type CartItem = {
  id: string;
  type: "NEW" | "USED";
  title: string;
  variant?: string;
  price: number;
  image?: string;
};

type CartPanelProps = {
  shopId?: string;
  isDark: boolean;
  lang: "RU" | "UZ";
  currency: "USD" | "UZS";
  currencyRate: number;
};

type CheckoutStep = "cart" | "phone_input" | "loading" | "success";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function fmtPrice(usd: number, rate: number, currency: "USD" | "UZS"): string {
  if (currency === "USD") return `$${usd.toLocaleString("en-US")}`;
  const sum = Math.round(usd * rate);
  return `${sum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сум`;
}

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

/* Phone SVG mini */
function PhoneMini({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="8" width="88" height="184" rx="20" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <rect x="24" y="30" width="72" height="136" rx="4" fill="currentColor" opacity="0.05" />
      <rect x="46" y="15" width="28" height="6" rx="3" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function CartPanel({
  shopId = "9362e37f-6800-47dc-be5d-e56df74103c6",
  isDark,
  lang,
  currency,
  currencyRate,
}: CartPanelProps) {
  const d = isDark;
  const { items, removeItem, clearCart, itemCount, totalPrice } = useCart();
  const { user: authUser, telegramUser, phone: defaultPhone } = useTelegramAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [phone, setPhone] = useState("+998 ");
  const [errorMessage, setErrorMessage] = useState("");

  // Sync phone from auth user when available
  useEffect(() => {
    if (defaultPhone && defaultPhone.length > 5) {
      setPhone(defaultPhone);
    }
  }, [defaultPhone]);

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setErrorMessage(
        lang === "RU"
          ? "Введите корректный номер телефона"
          : "To'g'ri telefon raqam kiriting"
      );
      return;
    }

    setErrorMessage("");
    setCheckoutStep("loading");

    const effectiveTelegramId =
      authUser?.telegramId ||
      (telegramUser?.telegramId ? String(telegramUser.telegramId) : "123456789");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          telegramId: effectiveTelegramId,
          phone: phone.trim(),
          items: items.map((item) => ({ type: item.type, id: item.id })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCheckoutStep("success");
        clearCart();
      } else {
        setErrorMessage(data.error || (lang === "RU" ? "Ошибка бронирования" : "Band qilishda xatolik"));
        setCheckoutStep("phone_input");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMessage(lang === "RU" ? "Ошибка сети при отправке брони" : "Tarmoq xatosi yuz berdi");
      setCheckoutStep("phone_input");
    }
  }

  function handleCloseSuccess() {
    clearCart();
    setCheckoutStep("cart");
    setIsExpanded(false);
  }

  // Strictly do NOT render if cart is empty and not on success modal
  if (itemCount === 0 && checkoutStep !== "success") return null;

  return (
    <div
      className="fixed bottom-4 left-0 right-0 mx-auto z-[75] pointer-events-none"
      style={{
        width: "calc(100% - 2rem)",
        maxWidth: "400px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <motion.div
        layout
        className="pointer-events-auto rounded-3xl overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl relative"
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
      >
        {/* Glass Edge Highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* ─── Collapsed Header ─── */}
        <motion.button
          layout="position"
          whileTap={{ scale: 0.98 }}
          transition={tapSpring}
          onClick={() => {
            if (checkoutStep === "success") {
              handleCloseSuccess();
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between"
        >
          {/* Left: icon + badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center
                  bg-[#007AFF]/15 border border-[#007AFF]/25 text-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.2)]
                `}
              >
                <ShoppingBag size={18} />
              </div>
              {/* Badge */}
              {itemCount > 0 && (
                <motion.div
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#007AFF] rounded-full flex items-center justify-center shadow-md shadow-[#007AFF]/40"
                >
                  <span className="text-[10px] font-bold text-white">{itemCount}</span>
                </motion.div>
              )}
            </div>

            {/* Center: label */}
            <div className="text-left">
              <p className="font-semibold text-[13px] leading-none text-white">
                {checkoutStep === "success"
                  ? lang === "RU" ? "Забронировано!" : "Band qilindi!"
                  : lang === "RU" ? "Корзина" : "Savat"}
              </p>
              <p className="text-[11px] mt-0.5 text-white/50">
                {checkoutStep === "success"
                  ? lang === "RU" ? "Успешно" : "Muvaffaqiyatli"
                  : `${itemCount} ${lang === "RU" ? (itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров") : "mahsulot"}`}
              </p>
            </div>
          </div>

          {/* Right: total + chevron */}
          <div className="flex items-center gap-2">
            {checkoutStep !== "success" && (
              <p className="text-[14px] font-bold text-[#5AC8FA]">
                {fmtPrice(totalPrice, currencyRate, currency)}
              </p>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 border border-white/10"
            >
              <ChevronUp size={14} className="text-white/70" />
            </motion.div>
          </div>
        </motion.button>

        {/* ─── Expanded Content ─── */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="overflow-hidden"
            >
              {/* Divider */}
              <div className="mx-4 h-px bg-white/10" />

              {/* ════════ STEP 1: CART ITEMS ════════ */}
              {checkoutStep === "cart" && (
                <motion.div
                  key="step-cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Items list */}
                  <div className="px-4 py-3 space-y-2.5 max-h-[240px] overflow-y-auto overscroll-contain scrollbar-none">
                    {items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/5 border border-white/10">
                          <PhoneMini className="w-7 h-10 text-white/70" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate text-white">
                            {item.title}
                          </p>
                          {item.variant && (
                            <p className="text-[11px] mt-0.5 truncate text-white/50">
                              {item.variant}
                            </p>
                          )}
                          <p className="text-[13px] font-bold text-[#5AC8FA] mt-1">
                            {fmtPrice(item.price, currencyRate, currency)}
                          </p>
                        </div>

                        {/* Remove button */}
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          transition={tapSpring}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FF3B30]/15 hover:bg-[#FF3B30]/25 border border-[#FF3B30]/20 transition-colors"
                        >
                          <Trash2 size={14} className="text-[#FF3B30]" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Timer block */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500]">
                      <Clock size={15} />
                      <p className="text-[12px] font-medium">
                        {lang === "RU"
                          ? "Бронь удерживается 24 часа"
                          : "Band 24 soat davomida saqlanadi"}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-4 h-px bg-white/10" />

                  {/* Total + CTA */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {lang === "RU" ? "Итого" : "Jami"}
                      </p>
                      <p className="text-[18px] font-extrabold tracking-tight text-white">
                        {fmtPrice(totalPrice, currencyRate, currency)}
                      </p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={tapSpring}
                      onClick={() => setCheckoutStep("phone_input")}
                      className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0A84FF] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,122,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all"
                    >
                      <ShoppingBag size={17} />
                      {lang === "RU" ? "Оформить бронь" : "Bandni rasmiylashtirish"}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ════════ STEP 2: PHONE INPUT ════════ */}
              {checkoutStep === "phone_input" && (
                <motion.div
                  key="step-phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-4 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      transition={tapSpring}
                      onClick={() => setCheckoutStep("cart")}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/10"
                    >
                      <ArrowLeft size={16} className="text-white/70" />
                    </motion.button>
                    <div>
                      <h4 className="text-[15px] font-bold tracking-tight text-white">
                        {lang === "RU" ? "Контактный телефон" : "Aloqa telefoni"}
                      </h4>
                      <p className="text-[11px] text-white/40">
                        {lang === "RU" ? "Для подтверждения вашей брони" : "Bandlovni tasdiqlash uchun"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-3 pt-1">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Phone size={16} className="text-white/40" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-[15px] font-semibold outline-none transition-all duration-200 bg-white/5 border border-white/10 text-white placeholder:text-white/30 backdrop-blur-md focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/25"
                        autoFocus
                      />
                    </div>

                    {errorMessage && (
                      <p className="text-[12px] text-[#FF3B30] font-medium px-1">
                        {errorMessage}
                      </p>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={tapSpring}
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0A84FF] text-white font-bold text-[15px] flex items-center justify-center gap-2 mt-2 shadow-[0_4px_20px_rgba(0,122,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all"
                    >
                      {lang === "RU" ? "Подтвердить бронь" : "Bandni tasdiqlash"}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ════════ STEP 3: LOADING ════════ */}
              {checkoutStep === "loading" && (
                <motion.div
                  key="step-loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <Loader2 size={36} className="text-[#007AFF] animate-spin" />
                  <p className="text-[14px] font-semibold text-white">
                    {lang === "RU" ? "Оформляем бронь..." : "Band rasmiylashtirilmoqda..."}
                  </p>
                  <p className="text-[12px] text-white/40">
                    {lang === "RU" ? "Пожалуйста, подождите" : "Iltimos, kuting"}
                  </p>
                </motion.div>
              )}

              {/* ════════ STEP 4: SUCCESS ════════ */}
              {checkoutStep === "success" && (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-[#34C759]/15 border border-[#34C759]/30 flex items-center justify-center text-[#34C759] shadow-[0_0_25px_rgba(52,199,89,0.3)]"
                  >
                    <CheckCircle size={36} strokeWidth={2.5} />
                  </motion.div>

                  <div className="space-y-1">
                    <h3 className="text-[18px] font-bold tracking-tight text-white">
                      {lang === "RU" ? "Успешно забронировано!" : "Muvaffaqiyatli band qilindi!"}
                    </h3>
                    <p className="text-[13px] font-medium leading-relaxed max-w-[280px] text-white/60">
                      {lang === "RU"
                        ? "Товары успешно забронированы на 24 часа"
                        : "Mahsulotlar 24 soatga band qilindi"}
                    </p>
                    <p className="text-[11px] pt-1 text-white/35">
                      {lang === "RU" ? `Менеджер свяжется с вами по номеру ${phone}` : `Menejer сиз bilan ${phone} raqami orqali bog'lanadi`}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={tapSpring}
                    onClick={handleCloseSuccess}
                    className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-[14px] mt-2 transition-colors"
                  >
                    {lang === "RU" ? "Закрыть" : "Yopish"}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
