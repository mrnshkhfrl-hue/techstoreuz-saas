"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
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
  Check,
  MessageCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Phone,
} from "lucide-react";
import ProductBottomSheet from "@/components/ProductBottomSheet";
import TradeInCalculator from "@/components/TradeInCalculator";
import CartPanel from "@/components/CartPanel";
import OnboardingModal from "@/components/OnboardingModal";
import Toast from "@/components/Toast";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useCart } from "@/providers/CartProvider";

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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const d = mounted ? resolvedTheme === "dark" : true;
  const isDark = d;

  const [activeTab, setActiveTab] = useState<"new" | "used" | "profile">("new");
  const [currency, setCurrency] = useState<"USD" | "UZS">("UZS");
  const [lang, setLang] = useState<"RU" | "UZ">("RU");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);

  /* ── Live Hooks (Auth & Cart) ── */
  const {
    user: authUser,
    telegramUser,
    isLoading: isAuthLoading,
    needsPhone,
    registerWithPhone,
  } = useTelegramAuth();
  const { addItem, itemCount } = useCart();

  const [toastState, setToastState] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({ message: "", visible: false, type: "success" });

  /* ── Derived ── */
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
      className={`max-w-[430px] mx-auto min-h-screen relative font-sans ${
        d ? "text-white sm:border-white/10" : "text-[#1C1C1E] sm:border-black/10"
      } bg-transparent sm:border-x transition-colors duration-200`}
    >
      {/* ═══════════════════════════════════════════════════
          HEADER — Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-40 ${
          d ? "bg-[#07070b]/75 border-white/10" : "bg-white/85 border-black/10 shadow-sm"
        } backdrop-blur-xl border-b shadow-xl transition-colors duration-300 relative`}
      >
        <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
          d ? "via-white/20" : "via-black/10"
        } to-transparent pointer-events-none`} />
        <div className="px-4 pt-10 pb-3">
          {/* Row 1: Title + controls */}
          <div className="flex items-center justify-between mb-3">
            <h1 className={`text-[22px] font-bold tracking-tight leading-none ${d ? "text-white" : "text-[#1C1C1E]"}`}>
              {shop.name}
            </h1>
            <div className="flex items-center gap-1.5">
              {/* Theme toggle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={tapSpring}
                onClick={() => setTheme(d ? "light" : "dark")}
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
                      exit={{ rotate: 90, opacity: 0 }}
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
          TRADE-IN BANNER — Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-1">
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={tapSpring}
          onClick={() => setIsTradeInOpen(true)}
          className={`w-full rounded-3xl relative overflow-hidden cursor-pointer ${
            d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"
          } backdrop-blur-lg border group transition-all`}
        >
          {/* Glass Edge Reflection */}
          <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
            d ? "via-white/25" : "via-black/10"
          } to-transparent pointer-events-none`} />

          {/* Ambient inner soft glowing orbs */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#007AFF]/20 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute left-6 -bottom-10 w-36 h-36 bg-[#7928CA]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/30 flex items-center justify-center text-[#007AFF]">
                <ArrowLeftRight size={12} />
              </div>
              <p className="text-[#007AFF] text-[11px] font-bold uppercase tracking-[0.15em]">
                Trade-in Express
              </p>
            </div>
            <h2 className={`${d ? "text-white" : "text-[#1C1C1E]"} text-[18px] font-bold mb-1 leading-snug tracking-tight`}>
              {lang === "RU"
                ? "Обменяйте старое на новое"
                : "Eskisini yangisiga almashtiring"}
            </h2>
            <p className={`${d ? "text-white/60" : "text-[#1C1C1E]/60"} text-[13px] mb-4 leading-relaxed max-w-[250px]`}>
              {lang === "RU"
                ? "Оценим ваше устройство за 2 минуты и предложим лучшую цену."
                : "Qurilmangizni 2 daqiqada baholaymiz va eng yaxshi narxni beramiz."}
            </p>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={tapSpring}
              onClick={(e) => {
                e.stopPropagation();
                setIsTradeInOpen(true);
              }}
              className={`px-5 py-2.5 ${
                d
                  ? "bg-white/10 hover:bg-white/15 text-white border-white/20"
                  : "bg-black/5 hover:bg-black/10 text-[#1C1C1E] border-black/10"
              } border text-[13px] font-bold rounded-2xl shadow-sm backdrop-blur-md flex items-center gap-2 transition-all`}
            >
              <span>{lang === "RU" ? "Оценить устройство" : "Qurilmani baholash"}</span>
              <span className="text-[#007AFF]">→</span>
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
                        className={`rounded-3xl p-4 flex flex-col cursor-pointer relative overflow-hidden transition-all group border ${
                          d
                            ? "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 shadow-xl"
                            : "bg-white border-black/10 hover:border-black/20 shadow-sm hover:shadow-md"
                        }`}
                      >
                        {/* Glass Edge highlight */}
                        <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
                          d ? "via-white/20" : "via-black/10"
                        } to-transparent pointer-events-none`} />

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
                        rounded-3xl p-4 flex gap-3.5 cursor-pointer border
                        relative overflow-hidden transition-all group
                        ${
                          d
                            ? "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 shadow-xl"
                            : "bg-white border-black/10 hover:border-black/20 shadow-sm hover:shadow-md"
                        }
                        ${isBooked || isSold ? "opacity-50" : ""}
                      `}
                    >
                      {/* Glass Edge highlight */}
                      <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
                        d ? "via-white/20" : "via-black/10"
                      } to-transparent pointer-events-none`} />

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
                          <p className="font-bold text-[15px] text-[#5AC8FA] leading-none">
                            {fmtPrice(p.price, shop.currencyRate, currency)}
                          </p>
                          {!isBooked && !isSold && (
                            <motion.button
                              whileTap={{ scale: 0.93 }}
                              transition={tapSpring}
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem({
                                  id: p.id,
                                  type: "USED",
                                  title: p.title,
                                  variant: `Б/У · ${p.batteryHealth}% АКБ · ${p.region}`,
                                  price: p.price,
                                });
                              }}
                              className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0A84FF] text-white text-[11px] font-bold rounded-xl shadow-md shadow-[#007AFF]/25 transition-all flex items-center gap-1"
                            >
                              <ShoppingBag size={12} />
                              <span>{lang === "RU" ? "Забронировать" : "Band qilish"}</span>
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
              {isAuthLoading ? (
                /* ── Skeleton while syncing silently with Supabase ── */
                <div className={`w-full rounded-3xl p-6 ${d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"} backdrop-blur-lg border relative overflow-hidden flex flex-col items-center`}>
                  <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${d ? "via-white/25" : "via-black/10"} to-transparent pointer-events-none`} />
                  <div className={`w-20 h-20 rounded-full ${d ? "bg-white/10" : "bg-black/10"} animate-pulse mb-4`} />
                  <div className={`w-36 h-5 rounded-xl ${d ? "bg-white/10" : "bg-black/10"} animate-pulse mb-2`} />
                  <div className={`w-28 h-3.5 rounded-lg ${d ? "bg-white/5" : "bg-black/5"} animate-pulse mb-6`} />
                  <div className="w-full grid grid-cols-2 gap-3 mb-5">
                    <div className={`h-16 rounded-2xl ${d ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border animate-pulse`} />
                    <div className={`h-16 rounded-2xl ${d ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border animate-pulse`} />
                  </div>
                  <div className={`w-full h-12 rounded-2xl ${d ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border animate-pulse`} />
                </div>
              ) : (
                /* ── Verified Profile Card in Liquid Glass ── */
                <div className={`w-full rounded-3xl p-6 ${d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"} backdrop-blur-lg border relative overflow-hidden flex flex-col items-center`}>
                  <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${d ? "via-white/25" : "via-black/10"} to-transparent pointer-events-none`} />
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Avatar */}
                  <div className="relative mb-3">
                    {authUser?.photoUrl || telegramUser?.photoUrl ? (
                      <img
                        src={authUser?.photoUrl || telegramUser?.photoUrl}
                        alt={authUser?.name || "User"}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007AFF] to-[#7928CA] flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20 shadow-lg shadow-[#007AFF]/20">
                        {(authUser?.name || telegramUser?.firstName || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#34C759] border-2 border-[#07070b] flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white stroke-[3]" />
                    </div>
                  </div>

                  {/* Name and Username */}
                  <h2 className={`text-[19px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"} flex items-center gap-1.5`}>
                    <span>{authUser?.name || telegramUser?.firstName || (lang === "RU" ? "Пользователь" : "Foydalanuvchi")}</span>
                    {(authUser?.isPremium || telegramUser?.isPremium) && (
                      <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                        ★ PRO
                      </span>
                    )}
                  </h2>
                  <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"} mt-0.5 mb-2 font-mono`}>
                    {telegramUser?.username ? `@${telegramUser.username}` : `ID: ${authUser?.telegramId || telegramUser?.telegramId || "—"}`}
                  </p>

                  {/* Phone Badge */}
                  {authUser?.phone && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${d ? "bg-white/5 border-white/10 text-white/80" : "bg-black/5 border-black/10 text-[#1C1C1E]/80"} text-[12px] font-mono mb-4 backdrop-blur-md`}>
                      <Phone size={12} className="text-[#34C759]" />
                      <span>{authUser.phone}</span>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="w-full grid grid-cols-2 gap-3 mb-4">
                    <div className={`${d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"} border rounded-2xl p-3 text-left backdrop-blur-md`}>
                      <div className={`flex items-center gap-1.5 ${d ? "text-white/50" : "text-[#1C1C1E]/50"} text-[11px] mb-1 font-medium`}>
                        <Clock size={12} className="text-[#007AFF]" />
                        <span>{lang === "RU" ? "Брони" : "Bandlovlar"}</span>
                      </div>
                      <p className={`text-[17px] font-extrabold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {authUser?.bookings?.length || 0}
                      </p>
                    </div>

                    <div className={`${d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"} border rounded-2xl p-3 text-left backdrop-blur-md`}>
                      <div className={`flex items-center gap-1.5 ${d ? "text-white/50" : "text-[#1C1C1E]/50"} text-[11px] mb-1 font-medium`}>
                        <ShieldCheck size={12} className="text-[#34C759]" />
                        <span>{lang === "RU" ? "Статус" : "Status"}</span>
                      </div>
                      <p className="text-[15px] font-bold text-[#34C759]">
                        {lang === "RU" ? "Подтвержден" : "Tasdiqlangan"}
                      </p>
                    </div>
                  </div>

                  {/* Recent Bookings Section if available */}
                  {authUser?.bookings && authUser.bookings.length > 0 && (
                    <div className="w-full mb-4">
                      <div className="text-left mb-2 px-1">
                        <h4 className={`text-[12px] font-bold uppercase tracking-wider ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                          {lang === "RU" ? "История броней" : "Bandlovlar tarixi"}
                        </h4>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                        {authUser.bookings.slice(0, 3).map((b: any) => (
                          <div
                            key={b.id}
                            className={`${d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"} border rounded-2xl p-3 flex items-center justify-between text-left`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={`text-[13px] font-semibold ${d ? "text-white" : "text-[#1C1C1E]"} truncate`}>
                                {b.usedProduct?.title || b.variant?.template?.title || "iPhone"}
                              </p>
                              <p className={`text-[11px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
                                {new Date(b.createdAt).toLocaleDateString(lang === "RU" ? "ru-RU" : "uz-UZ")}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === "CONFIRMED"
                                ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/25"
                                : b.status === "CANCELLED"
                                ? "bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/25"
                                : "bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/25"
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Support Action */}
                  <a
                    href="https://t.me/techstore_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 rounded-2xl ${
                      d
                        ? "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-[#1C1C1E]"
                    } border text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-md backdrop-blur-md`}
                  >
                    <MessageCircle size={16} className="text-[#007AFF]" />
                    {lang === "RU" ? "Поддержка в Telegram" : "Telegram qo'llab-quvvatlash"}
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════════════════════════════════════════════════
          FLOATING CART PANEL (Only if items exist)
          ═══════════════════════════════════════════════════ */}
      {itemCount > 0 && (
        <CartPanel
          shopId={shop.id}
          isDark={d}
          lang={lang}
          currency={currency}
          currencyRate={shop.currencyRate}
        />
      )}

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

      {/* ═══════════════════════════════════════════════════
          ONBOARDING PHONE VERIFICATION MODAL
          ═══════════════════════════════════════════════════ */}
      <OnboardingModal
        isOpen={needsPhone && !isAuthLoading}
        telegramUser={telegramUser}
        onRegister={registerWithPhone}
        onSuccess={() => {
          setToastState({
            message:
              lang === "RU"
                ? "Успешно! Номер телефона привязан."
                : "Muvaffaqiyatli! Telefon raqami biriktirildi.",
            visible: true,
            type: "success",
          });
        }}
      />

      {/* ═══════════════════════════════════════════════════
          TOAST NOTIFICATIONS
          ═══════════════════════════════════════════════════ */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        visible={toastState.visible}
        onClose={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
