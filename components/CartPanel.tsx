"use client";

import { useState } from "react";
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

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

export type CartItem = {
  id: string;
  type: "NEW" | "USED";
  title: string;
  variant?: string;
  price: number;
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
   HARDCODED TEST ITEMS
   ═══════════════════════════════════════════════════════ */

const MOCK_ITEMS: CartItem[] = [
  {
    id: "var_mock_1",
    type: "NEW",
    title: "iPhone 16 Pro Max",
    variant: "256GB · Black Titanium · eSIM",
    price: 1399,
  },
  {
    id: "used_mock_2",
    type: "USED",
    title: "iPhone 15 Pro",
    variant: "Б/У · 92% батарея · LL/A",
    price: 820,
  },
];

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [items, setItems] = useState<CartItem[]>(MOCK_ITEMS);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [phone, setPhone] = useState("+998 ");
  const [errorMessage, setErrorMessage] = useState("");

  const totalPrice = items.reduce((sum, i) => sum + i.price, 0);
  const itemCount = items.length;

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setErrorMessage(lang === "RU" ? "Введите корректный номер телефона" : "To'g'ri telefon raqam kiriting");
      return;
    }

    setErrorMessage("");
    setCheckoutStep("loading");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          telegramId: "123456789",
          phone: phone.trim(),
          items: items.map((item) => ({ type: item.type, id: item.id })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCheckoutStep("success");
      } else {
        setErrorMessage(data.error || "Ошибка бронирования");
        setCheckoutStep("phone_input");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMessage("Ошибка сети при отправке брони");
      setCheckoutStep("phone_input");
    }
  }

  function handleCloseSuccess() {
    setItems([]);
    setCheckoutStep("cart");
    setIsExpanded(false);
  }

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
        className="pointer-events-auto rounded-glass overflow-hidden liquid-glass-float"
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
      >
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
                  w-10 h-10 rounded-glass-btn flex items-center justify-center
                  ${d ? "bg-[#007AFF]/12" : "bg-[#007AFF]/8"}
                `}
              >
                <ShoppingBag size={18} className="text-[#007AFF]" />
              </div>
              {/* Badge */}
              {itemCount > 0 && (
                <motion.div
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#007AFF] rounded-full flex items-center justify-center shadow-md shadow-[#007AFF]/25"
                >
                  <span className="text-[10px] font-bold text-white">{itemCount}</span>
                </motion.div>
              )}
            </div>

            {/* Center: label */}
            <div className="text-left">
              <p className={`font-semibold text-[13px] leading-none ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                {checkoutStep === "success"
                  ? lang === "RU" ? "Забронировано!" : "Band qilindi!"
                  : lang === "RU" ? "Корзина" : "Savat"}
              </p>
              <p className={`text-[11px] mt-0.5 ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                {checkoutStep === "success"
                  ? lang === "RU" ? "Успешно" : "Muvaffaqiyatli"
                  : `${itemCount} ${lang === "RU" ? (itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров") : "mahsulot"}`}
              </p>
            </div>
          </div>

          {/* Right: total + chevron */}
          <div className="flex items-center gap-2">
            {checkoutStep !== "success" && (
              <p className="text-[14px] font-bold text-[#007AFF]">
                {fmtPrice(totalPrice, currencyRate, currency)}
              </p>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`
                w-7 h-7 rounded-full flex items-center justify-center
                ${d ? "bg-white/[0.06]" : "bg-black/[0.04]"}
              `}
            >
              <ChevronUp size={14} className={d ? "text-white/40" : "text-[#1C1C1E]/40"} />
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
              <div className={`mx-4 h-px ${d ? "bg-white/[0.04]" : "bg-black/[0.04]"}`} />

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
                  <div className="px-4 py-3 space-y-2.5 max-h-[240px] overflow-y-auto overscroll-contain">
                    {items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-glass-btn liquid-glass`}
                      >
                        {/* Thumbnail */}
                        <div
                          className={`
                            w-12 h-14 rounded-glass-xs flex-shrink-0 flex items-center justify-center
                            ${d ? "bg-gradient-to-b from-white/[0.03] to-transparent" : "bg-gradient-to-b from-black/[0.02] to-transparent"}
                          `}
                        >
                          <PhoneMini className={`w-7 h-10 ${d ? "text-white" : "text-gray-400"}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                            {item.title}
                          </p>
                          {item.variant && (
                            <p className={`text-[11px] mt-0.5 truncate ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                              {item.variant}
                            </p>
                          )}
                          <p className="text-[13px] font-bold text-[#007AFF] mt-1">
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
                          className={`
                            w-8 h-8 rounded-glass-xs flex items-center justify-center flex-shrink-0
                            ${d ? "bg-[#FF3B30]/8 hover:bg-[#FF3B30]/15" : "bg-[#FF3B30]/6 hover:bg-[#FF3B30]/10"}
                            transition-colors
                          `}
                        >
                          <Trash2 size={14} className="text-[#FF3B30]" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Timer block */}
                  <div className="px-4 pb-3">
                    <div
                      className={`
                        flex items-center gap-2.5 px-4 py-3 rounded-glass-btn
                        ${d ? "bg-[#FF9500]/6 border border-[#FF9500]/10" : "bg-[#FF9500]/5 border border-[#FF9500]/10"}
                      `}
                    >
                      <Clock size={15} className="text-[#FF9500]" />
                      <p className={`text-[12px] font-medium text-[#FF9500]`}>
                        {lang === "RU"
                          ? "Бронь удерживается 24 часа"
                          : "Band 24 soat davomida saqlanadi"}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`mx-4 h-px ${d ? "bg-white/[0.04]" : "bg-black/[0.04]"}`} />

                  {/* Total + CTA */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                        {lang === "RU" ? "Итого" : "Jami"}
                      </p>
                      <p className={`text-[18px] font-extrabold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {fmtPrice(totalPrice, currencyRate, currency)}
                      </p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={tapSpring}
                      onClick={() => setCheckoutStep("phone_input")}
                      className="w-full py-4 rounded-glass-btn btn-system-blue text-[15px] flex items-center justify-center gap-2"
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
                      className="w-8 h-8 rounded-full flex items-center justify-center liquid-glass"
                    >
                      <ArrowLeft size={16} className={d ? "text-white/60" : "text-[#1C1C1E]/60"} />
                    </motion.button>
                    <div>
                      <h4 className={`text-[15px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {lang === "RU" ? "Контактный телефон" : "Aloqa telefoni"}
                      </h4>
                      <p className={`text-[11px] ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                        {lang === "RU" ? "Для подтверждения вашей брони" : "Bandlovni tasdiqlash uchun"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-3 pt-1">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Phone size={16} className={d ? "text-white/30" : "text-[#1C1C1E]/30"} />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className={`
                          w-full pl-11 pr-4 py-3.5 rounded-glass-btn text-[15px] font-semibold outline-none
                          transition-all duration-200 liquid-glass
                          ${d
                            ? "text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                            : "text-[#1C1C1E] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                          }
                        `}
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
                      className="w-full py-4 rounded-glass-btn btn-system-blue text-[15px] flex items-center justify-center gap-2 mt-2"
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
                  <p className={`text-[14px] font-semibold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                    {lang === "RU" ? "Оформляем бронь..." : "Band rasmiylashtirilmoqda..."}
                  </p>
                  <p className={`text-[12px] ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
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
                    className="w-16 h-16 rounded-full bg-[#34C759]/10 border border-[#34C759]/15 flex items-center justify-center text-[#34C759] shadow-lg shadow-[#34C759]/10"
                  >
                    <CheckCircle size={36} strokeWidth={2.5} />
                  </motion.div>

                  <div className="space-y-1">
                    <h3 className={`text-[18px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                      {lang === "RU" ? "Успешно забронировано!" : "Muvaffaqiyatli band qilindi!"}
                    </h3>
                    <p className={`text-[13px] font-medium leading-relaxed max-w-[280px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
                      {lang === "RU"
                        ? "Товары успешно забронированы на 24 часа"
                        : "Mahsulotlar 24 soatga band qilindi"}
                    </p>
                    <p className={`text-[11px] pt-1 ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                      {lang === "RU" ? `Менеджер свяжется с вами по номеру ${phone}` : `Menejer сиз bilan ${phone} raqami orqali bog'lanadi`}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={tapSpring}
                    onClick={handleCloseSuccess}
                    className="w-full py-3.5 rounded-glass-btn btn-system-blue text-[14px] mt-2"
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
