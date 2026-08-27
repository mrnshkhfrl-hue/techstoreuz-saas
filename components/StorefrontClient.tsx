"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Smartphone,
  Battery,
  Box,
  AlertCircle,
  User,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import ProductBottomSheet from "@/components/ProductBottomSheet";
import TradeInCalculator from "@/components/TradeInCalculator";
import CartPanel from "@/components/CartPanel";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function fmtPrice(usd: number, rate: number, currency: "USD" | "UZS"): string {
  if (currency === "USD") {
    return `$${usd.toLocaleString("en-US")}`;
  }
  const sum = Math.round(usd * rate);
  return `${sum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сум`;
}

/* SVG-силуэт телефона */
function PhoneSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="16" y="8" width="88" height="184" rx="20"
        stroke="currentColor" strokeWidth="2" opacity="0.2"
      />
      <rect x="24" y="30" width="72" height="136" rx="4" fill="currentColor" opacity="0.04" />
      <rect x="46" y="15" width="28" height="6" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="44" y="178" width="32" height="5" rx="2.5" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const tabContentVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/* Spring config for taps */
const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

type StorefrontProps = {
  shop: any;
};

export default function StorefrontClient({ shop }: StorefrontProps) {
  /* ── State ── */
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"new" | "used" | "profile">("new");
  const [currency, setCurrency] = useState<"USD" | "UZS">("UZS");
  const [lang, setLang] = useState<"RU" | "UZ">("RU");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);

  /* ── Derived ── */
  const d = isDark;
  const tabs = useMemo(
    () => [
      { key: "new" as const, label: lang === "RU" ? "Новые" : "Yangi" },
      { key: "used" as const, label: lang === "RU" ? "Б/У" : "Б/У" },
      { key: "profile" as const, label: lang === "RU" ? "Профиль" : "Profil" },
    ],
    [lang]
  );

  return (
    <div
      className={`
        max-w-[430px] mx-auto min-h-screen relative overflow-hidden
        font-sans transition-colors duration-500
        sm:border-x
        ${d ? "border-white/[0.04]" : "border-black/[0.04]"}
        ${d ? "bg-black text-white" : "bg-[#F2F2F7] text-[#1C1C1E]"}
      `}
    >
      {/* ═══════════════════════════════════════════════════
          HEADER — Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <header
        className={`
          sticky top-0 z-40 transition-colors duration-500
          ${d ? "bg-black/70" : "bg-[#F2F2F7]/70"}
          backdrop-blur-[80px] backdrop-saturate-200
          border-b
          ${d ? "border-white/[0.04]" : "border-black/[0.04]"}
        `}
      >
        <div className="px-4 pt-12 pb-3">
          {/* Row 1: Title + controls */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[22px] font-bold tracking-tight leading-none">
              {shop.name}
            </h1>
            <div className="flex items-center gap-1.5">
              {/* Theme toggle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={tapSpring}
                onClick={() => setIsDark(!isDark)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  liquid-glass transition-colors
                `}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun size={14} className="text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon size={14} className="text-[#1C1C1E]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Lang toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={tapSpring}
                onClick={() => setLang(lang === "RU" ? "UZ" : "RU")}
                className={`
                  h-7 px-2.5 rounded-full text-[11px] font-semibold
                  liquid-glass
                  ${d ? "text-white/60" : "text-[#1C1C1E]/60"}
                `}
              >
                {lang === "RU" ? "RU" : "UZ"}
              </motion.button>

              {/* Currency toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={tapSpring}
                onClick={() => setCurrency(currency === "UZS" ? "USD" : "UZS")}
                className={`
                  h-7 px-2.5 rounded-full text-[11px] font-semibold
                  liquid-glass
                  ${d ? "text-white/60" : "text-[#1C1C1E]/60"}
                `}
              >
                {currency === "UZS" ? "СУМ" : "USD"}
              </motion.button>
            </div>
          </div>

          {/* Segmented Control — Liquid Glass */}
          <div
            className={`
              flex p-[3px] rounded-full relative
              ${d ? "bg-white/[0.04] border border-white/[0.06]" : "bg-black/[0.04] border border-black/[0.04]"}
            `}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative flex-1 py-[7px] text-[13px] font-semibold
                    rounded-full transition-colors z-10
                    ${isActive ? "" : d ? "text-white/30" : "text-[#1C1C1E]/30"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`
                        absolute inset-0 rounded-full
                        ${
                          tab.key === "new"
                            ? "bg-[#007AFF] shadow-lg shadow-[#007AFF]/25"
                            : d
                              ? "bg-white/[0.08] shadow-sm"
                              : "bg-white shadow-sm shadow-black/[0.04]"
                        }
                      `}
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      isActive
                        ? tab.key === "new"
                          ? "text-white"
                          : d ? "text-white" : "text-[#1C1C1E]"
                        : ""
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          TRADE-IN BANNER — Liquid Glass on System Blue
          ═══════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-1">
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={tapSpring}
          className="w-full rounded-glass relative overflow-hidden cursor-pointer bg-[#007AFF]"
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 liquid-glass rounded-glass" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Subtle decorative orbs */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute left-4 -bottom-10 w-28 h-28 bg-white/8 rounded-full blur-3xl" />

          <div className="relative z-10 p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowLeftRight size={13} className="text-white/60" />
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.15em]">
                Trade-in
              </p>
            </div>
            <h2 className="text-white text-[17px] font-bold mb-1 leading-snug tracking-tight">
              {lang === "RU"
                ? "Обменяйте старое на новое"
                : "Eskisini yangisiga almashtiring"}
            </h2>
            <p className="text-white/65 text-[13px] mb-4 leading-relaxed max-w-[240px]">
              {lang === "RU"
                ? "Оценим ваше устройство и предложим лучшую цену."
                : "Qurilmangizni baholaymiz va eng yaxshi narxni taklif qilamiz."}
            </p>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={tapSpring}
              onClick={() => setIsTradeInOpen(true)}
              className="px-5 py-2.5 bg-white text-[#007AFF] text-[13px] font-bold rounded-glass-btn shadow-lg shadow-black/10 transition-colors"
            >
              {lang === "RU" ? "Оценить устройство" : "Qurilmani baholash"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CONTENT AREA
          ═══════════════════════════════════════════════════ */}
      <main className="px-4 pt-3 pb-32 min-h-[50vh]">
        <AnimatePresence mode="wait">
          {/* ────────── TAB: NEW ────────── */}
          {activeTab === "new" && (
            <motion.div
              key="tab-new"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <motion.div
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="grid grid-cols-2 gap-3"
              >
                {shop.newProducts?.length > 0 ? (
                  shop.newProducts.map((p: any, i: number) => {
                    const minPrice = p.variants?.length
                      ? Math.min(...p.variants.map((v: any) => v.price))
                      : p.basePrice;
                    const colorCount = new Set(
                      p.variants?.map((v: any) => v.color) || []
                    ).size;
                    const storageSet = new Set(
                      p.variants?.map((v: any) => v.storage) || []
                    );

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.06,
                          type: "spring",
                          stiffness: 300,
                          damping: 24,
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedProduct(p)}
                        className={`
                          liquid-glass glass-edge-highlight
                          rounded-glass p-3.5 flex flex-col cursor-pointer
                          relative overflow-hidden transition-all group
                          ${d ? "hover:bg-white/[0.06]" : "hover:bg-white/80"}
                        `}
                      >
                        {/* NEW badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="flex items-center gap-1 bg-[#007AFF] text-white text-[9px] font-bold px-2 py-[3px] rounded-glass-sm shadow-md shadow-[#007AFF]/20">
                            <Sparkles size={9} />
                            NEW
                          </div>
                        </div>

                        {/* Phone illustration */}
                        <div
                          className={`
                            w-full aspect-square rounded-glass-lg mb-3
                            flex items-center justify-center
                            ${d ? "bg-gradient-to-b from-white/[0.02] to-transparent" : "bg-gradient-to-b from-black/[0.02] to-transparent"}
                            group-hover:scale-[1.02] transition-transform duration-500
                          `}
                        >
                          <PhoneSilhouette
                            className={`w-16 h-24 ${d ? "text-white" : "text-gray-400"}`}
                          />
                        </div>

                        {/* Title */}
                        <h3
                          className={`font-semibold text-[13px] leading-tight mb-1.5 tracking-tight ${
                            d ? "text-white/90" : "text-[#1C1C1E]"
                          }`}
                        >
                          {p.title}
                        </h3>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {p.variants?.length > 0 && (
                            <span
                              className={`text-[9px] font-medium px-1.5 py-[2px] rounded-glass-xs ${
                                d
                                  ? "bg-white/[0.06] text-white/50 border border-white/[0.06]"
                                  : "bg-black/[0.04] text-[#1C1C1E]/50 border border-black/[0.04]"
                              }`}
                            >
                              {storageSet.size} памят{storageSet.size > 1 ? "и" : "ь"}
                            </span>
                          )}
                          {colorCount > 0 && (
                            <span
                              className={`text-[9px] font-medium px-1.5 py-[2px] rounded-glass-xs ${
                                d
                                  ? "bg-white/[0.06] text-white/50 border border-white/[0.06]"
                                  : "bg-black/[0.04] text-[#1C1C1E]/50 border border-black/[0.04]"
                              }`}
                            >
                              {colorCount} цвет{colorCount > 1 ? (colorCount < 5 ? "а" : "ов") : ""}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mt-auto">
                          <p
                            className={`text-[9px] uppercase tracking-[0.15em] mb-0.5 font-medium ${
                              d ? "text-white/25" : "text-[#1C1C1E]/25"
                            }`}
                          >
                            {lang === "RU" ? "от" : "dan"}
                          </p>
                          <p className="font-bold text-[14px] text-[#007AFF] leading-none">
                            {fmtPrice(minPrice, shop.currencyRate, currency)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div
                    className={`col-span-2 liquid-glass rounded-glass flex flex-col items-center justify-center py-16 text-center`}
                  >
                    <Smartphone
                      size={32}
                      className={`mb-3 ${d ? "text-white/20" : "text-[#1C1C1E]/20"}`}
                    />
                    <p className={`text-sm ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      {lang === "RU" ? "Новых товаров пока нет" : "Hozircha yangi tovarlar yo'q"}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ────────── TAB: USED ────────── */}
          {activeTab === "used" && (
            <motion.div
              key="tab-used"
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              {shop.usedProducts?.length > 0 ? (
                shop.usedProducts.map((p: any, i: number) => {
                  const isBooked = p.status === "BOOKED";
                  const isSold =
                    p.status === "SOLD_OFFLINE" || p.status === "SOLD_ONLINE";
                  const bh = p.batteryHealth;
                  const batteryColor =
                    bh >= 90
                      ? d
                        ? "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/15"
                        : "text-[#34C759] bg-[#34C759]/8 border-[#34C759]/15"
                      : bh >= 80
                        ? d
                          ? "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/15"
                          : "text-[#FF9500] bg-[#FF9500]/8 border-[#FF9500]/15"
                        : d
                          ? "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/15"
                          : "text-[#FF3B30] bg-[#FF3B30]/8 border-[#FF3B30]/15";

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isBooked && !isSold && setSelectedProduct(p)}
                      className={`
                        liquid-glass glass-edge-highlight
                        rounded-glass p-3.5 flex gap-3.5 cursor-pointer
                        relative overflow-hidden transition-all
                        ${d ? "hover:bg-white/[0.06]" : "hover:bg-white/80"}
                        ${isBooked || isSold ? "opacity-50" : ""}
                      `}
                    >
                      {/* Phone image */}
                      <div
                        className={`
                          w-[76px] h-[96px] rounded-glass-md flex-shrink-0
                          flex items-center justify-center
                          ${d ? "bg-gradient-to-b from-white/[0.02] to-transparent" : "bg-gradient-to-b from-black/[0.02] to-transparent"}
                        `}
                      >
                        <PhoneSilhouette
                          className={`w-10 h-16 ${d ? "text-white" : "text-gray-400"}`}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3
                            className={`font-semibold text-[13px] mb-2 truncate tracking-tight ${
                              d ? "text-white/90" : "text-[#1C1C1E]"
                            }`}
                          >
                            {p.title}
                          </h3>

                          {/* Badge row */}
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-[2px] rounded-glass-xs border flex items-center gap-1 ${batteryColor}`}
                            >
                              <Battery size={10} />
                              {bh}%
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-[2px] rounded-glass-xs ${
                                d
                                  ? "bg-white/[0.06] text-white/50 border border-white/[0.06]"
                                  : "bg-black/[0.04] text-[#1C1C1E]/50 border border-black/[0.04]"
                              }`}
                            >
                              {p.region}
                            </span>
                            {p.hasBox && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-[2px] rounded-glass-xs flex items-center gap-0.5 ${
                                  d
                                    ? "bg-white/[0.06] text-white/50 border border-white/[0.06]"
                                    : "bg-black/[0.04] text-[#1C1C1E]/50 border border-black/[0.04]"
                                }`}
                              >
                                <Box size={9} />
                                {lang === "RU" ? "Коробка" : "Quti"}
                              </span>
                            )}
                            {p.defects && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-[2px] rounded-glass-xs flex items-center gap-0.5 ${
                                  d
                                    ? "bg-[#FF9500]/8 text-[#FF9500] border border-[#FF9500]/12"
                                    : "bg-[#FF9500]/6 text-[#FF9500] border border-[#FF9500]/12"
                                }`}
                              >
                                <AlertCircle size={9} />
                                {lang === "RU" ? "Дефект" : "Nuqson"}
                              </span>
                            )}
                            {isBooked && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-[2px] rounded-glass-xs ${
                                  d
                                    ? "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/15"
                                    : "bg-[#FF9500]/8 text-[#FF9500] border border-[#FF9500]/15"
                                }`}
                              >
                                {lang === "RU" ? "Забронирован" : "Band qilingan"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-[15px] text-[#007AFF] leading-none">
                            {fmtPrice(p.price, shop.currencyRate, currency)}
                          </p>
                          {!isBooked && !isSold && (
                            <motion.button
                              whileTap={{ scale: 0.93 }}
                              transition={tapSpring}
                              className="px-3 py-1.5 bg-[#007AFF] text-white text-[11px] font-bold rounded-glass-sm transition-colors shadow-md shadow-[#007AFF]/20"
                            >
                              {lang === "RU" ? "Забронировать" : "Band qilish"}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div
                  className={`liquid-glass rounded-glass flex flex-col items-center justify-center py-16 text-center`}
                >
                  <Smartphone
                    size={32}
                    className={`mb-3 ${d ? "text-white/20" : "text-[#1C1C1E]/20"}`}
                  />
                  <p className={`text-sm ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                    {lang === "RU" ? "Б/У товаров пока нет" : "Hozircha Б/У tovarlar yo'q"}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── TAB: PROFILE ────────── */}
          {activeTab === "profile" && (
            <motion.div
              key="tab-profile"
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div
                className={`
                  liquid-glass glass-edge-highlight
                  rounded-glass p-6
                  flex flex-col items-center text-center mt-1
                  relative overflow-hidden
                `}
              >
                <div className="w-20 h-20 bg-[#007AFF] rounded-glass-lg mb-5 shadow-lg shadow-[#007AFF]/20 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <h2
                  className={`text-lg font-bold tracking-tight ${
                    d ? "text-white/90" : "text-[#1C1C1E]"
                  }`}
                >
                  {lang === "RU" ? "Ваш профиль" : "Sizning profilingiz"}
                </h2>
                <p
                  className={`text-[13px] mt-1.5 mb-6 max-w-[220px] leading-relaxed ${
                    d ? "text-white/40" : "text-[#1C1C1E]/40"
                  }`}
                >
                  {lang === "RU"
                    ? "Авторизуйтесь, чтобы отслеживать бронирования и историю заказов"
                    : "Buyurtmalar va bandlovlarni kuzatish uchun tizimga kiring"}
                </p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={tapSpring}
                  className="w-full py-3 btn-system-blue text-sm rounded-glass-btn"
                >
                  {lang === "RU"
                    ? "Войти через Telegram"
                    : "Telegram orqali kirish"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════════════════════════════════════════════════
          FLOATING CART PANEL
          ═══════════════════════════════════════════════════ */}
      <CartPanel
        shopId={shop.id}
        isDark={d}
        lang={lang}
        currency={currency}
        currencyRate={shop.currencyRate}
      />

      {/* ═══════════════════════════════════════════════════
          PRODUCT BOTTOM SHEET
          ═══════════════════════════════════════════════════ */}
      <ProductBottomSheet
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        isDark={d}
        lang={lang}
        currency={currency}
        currencyRate={shop.currencyRate}
      />

      {/* ═══════════════════════════════════════════════════
          TRADE-IN CALCULATOR
          ═══════════════════════════════════════════════════ */}
      <TradeInCalculator
        isOpen={isTradeInOpen}
        onClose={() => setIsTradeInOpen(false)}
        isDark={d}
        lang={lang}
        currency={currency}
        currencyRate={shop.currencyRate}
      />
    </div>
  );
}
