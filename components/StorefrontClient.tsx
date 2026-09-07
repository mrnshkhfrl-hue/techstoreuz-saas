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
  Phone,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  MapPin,
  X,
  CreditCard,
} from "lucide-react";
import ProductBottomSheet from "@/components/ProductBottomSheet";
import TradeInCalculator from "@/components/TradeInCalculator";
import OnboardingModal from "@/components/OnboardingModal";
import Toast from "@/components/Toast";
import BottomNavBar, { NavTab } from "@/components/BottomNavBar";
import SettingsTab from "@/components/SettingsTab";
import BookingsTab from "@/components/BookingsTab";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { getModelPhoto, extractStorage } from "@/lib/product-images";

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

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

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

  // Streamlined 4-tab navigation state (Cart removed!)
  const [navTab, setNavTab] = useState<NavTab>("catalog");

  // Catalog sub-tab: New vs Used
  const [catalogSubTab, setCatalogSubTab] = useState<"new" | "used">("new");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Used products filters & view mode
  const [usedViewMode, setUsedViewMode] = useState<"list" | "grid">("list");
  const [usedBatteryFilter, setUsedBatteryFilter] = useState("all");
  const [usedStorageFilter, setUsedStorageFilter] = useState("all");

  const [currency, setCurrency] = useState<"USD" | "UZS">("UZS");
  const [lang, setLang] = useState<"RU" | "UZ">(() => {
    if (typeof window !== "undefined") {
      const urlParam = new URLSearchParams(window.location.search).get("lang")?.toUpperCase();
      if (urlParam === "UZ" || urlParam === "RU") {
        localStorage.setItem("tg_shop_lang", urlParam);
        return urlParam as "RU" | "UZ";
      }
      const saved = localStorage.getItem("tg_shop_lang")?.toUpperCase();
      if (saved === "UZ" || saved === "RU") {
        return saved as "RU" | "UZ";
      }
    }
    return "RU";
  });

  const handleLangChange = (newLang: "RU" | "UZ") => {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("tg_shop_lang", newLang);
    }
  };

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  /* ── Live Hooks (Auth) ── */
  const {
    user: authUser,
    telegramUser,
    isLoading: isAuthLoading,
    needsPhone,
    registerWithPhone,
    refetch,
  } = useTelegramAuth();

  const [toastState, setToastState] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({ message: "", visible: false, type: "success" });
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);

  /* ── Proactive user avatar URL with raw streaming bypass ── */
  const userAvatarSrc = useMemo(() => {
    if (authUser?.photoUrl) return authUser.photoUrl;
    if (telegramUser?.photoUrl) return telegramUser.photoUrl;
    const tid = authUser?.telegramId || telegramUser?.telegramId;
    if (tid) return `/api/auth/photo?telegramId=${tid}&raw=1`;
    return "";
  }, [authUser?.photoUrl, telegramUser?.photoUrl, authUser?.telegramId, telegramUser?.telegramId]);

  /* ── Filtered New Products ── */
  const filteredNewProducts = useMemo(() => {
    if (!shop.newProducts) return [];
    if (!catalogSearch.trim()) return shop.newProducts;
    const q = catalogSearch.toLowerCase();
    return shop.newProducts.filter((p: any) => p.title.toLowerCase().includes(q));
  }, [shop.newProducts, catalogSearch]);

  /* ── Filtered Used Products (Hides Booked Devices & Applies Filters) ── */
  const filteredUsedProducts = useMemo(() => {
    if (!shop.usedProducts) return [];
    return shop.usedProducts.filter((p: any) => {
      // Hide already booked devices from public catalog
      if (p.status === "BOOKED") return false;

      // Unified search across title
      const q = catalogSearch.trim().toLowerCase();
      if (q && !p.title.toLowerCase().includes(q)) {
        return false;
      }

      // Battery Health filter
      if (usedBatteryFilter === "95+") {
        if (p.batteryHealth < 95) return false;
      } else if (usedBatteryFilter === "90+") {
        if (p.batteryHealth < 90 || p.batteryHealth >= 95) return false;
      } else if (usedBatteryFilter === "80+") {
        if (p.batteryHealth < 80 || p.batteryHealth >= 90) return false;
      } else if (usedBatteryFilter === "70+") {
        if (p.batteryHealth < 70 || p.batteryHealth >= 80) return false;
      }

      // Storage filter
      if (usedStorageFilter !== "all") {
        if (!p.title.toLowerCase().includes(usedStorageFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [shop.usedProducts, catalogSearch, usedBatteryFilter, usedStorageFilter]);

  /* ── 1-Click Direct 24-Hour Booking on Any Device ── */
  const handleBookProduct = async (product: any, variant?: any) => {
    const userPhone = authUser?.phone;
    const tgId = authUser?.telegramId || (telegramUser?.telegramId ? String(telegramUser.telegramId) : "");

    if (!userPhone) {
      setDismissedOnboarding(false);
      setSelectedProduct(product);
      setToastState({
        message:
          lang === "RU"
            ? "Для подтверждения брони введите номер телефона"
            : "Bandlovni tasdiqlash uchun telefon raqamingizni kiriting",
        visible: true,
        type: "error",
      });
      return;
    }

    setIsBookingLoading(true);
    try {
      const isUsed = Boolean(product.batteryHealth !== undefined && !product.variants);
      const bookingItemId = isUsed
        ? product.id
        : (variant?.id || product.variants?.[0]?.id || product.id);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          telegramId: tgId,
          phone: userPhone,
          items: [{ type: isUsed ? "USED" : "NEW", id: bookingItemId }],
        }),
      });

      if (res.ok) {
        setToastState({
          message:
            lang === "RU"
              ? "🟢 Устройство успешно забронировано на 24 часа! Ждем вас в магазине."
              : "🟢 Qurilma 24 soatga muvaffaqiyatli band qilindi! Sizni do'konda kutamiz.",
          visible: true,
          type: "success",
        });
        setSelectedProduct(null);
        await refetch();
        setNavTab("bookings");
      } else {
        const err = await res.json().catch(() => ({}));
        setToastState({
          message: err.error || (lang === "RU" ? "Ошибка бронирования" : "Band qilishda xatolik"),
          visible: true,
          type: "error",
        });
      }
    } catch (err: any) {
      setToastState({
        message: err.message || "Ошибка соединения с сервером",
        visible: true,
        type: "error",
      });
    } finally {
      setIsBookingLoading(false);
    }
  };

  /* ── Name Update in Settings ── */
  const handleNameUpdate = async (newName: string): Promise<boolean> => {
    const tgId = authUser?.telegramId || (telegramUser?.telegramId ? String(telegramUser.telegramId) : "");
    if (!tgId) return false;

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tgId,
          firstName: newName,
          phone: authUser?.phone || "",
        }),
      });
      if (res.ok) {
        await refetch();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <div
      className={`max-w-[430px] mx-auto min-h-screen relative font-sans ${
        d ? "text-white sm:border-white/10" : "text-[#1C1C1E] sm:border-black/10"
      } bg-transparent sm:border-x transition-colors duration-200 pb-20`}
    >
      {/* ═══════════════════════════════════════════════════
          HEADER — Minimal Apple Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-40 ${
          d ? "bg-[#07070b]/80 border-white/10" : "bg-white/85 border-black/10 shadow-sm"
        } backdrop-blur-xl border-b transition-colors duration-300 relative`}
      >
        <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
          d ? "via-white/20" : "via-black/10"
        } to-transparent pointer-events-none`} />

        <div className="px-4 pt-10 pb-3 flex items-center justify-between">
          <div>
            <h1 className={`text-[20px] font-bold tracking-tight leading-none ${d ? "text-white" : "text-[#1C1C1E]"}`}>
              {shop.name}
            </h1>
            <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"} mt-0.5`}>
              {lang === "RU" ? "Официальный магазин" : "Rasmiy do'kon"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Currency toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={tapSpring}
              onClick={() => setCurrency(currency === "UZS" ? "USD" : "UZS")}
              className={`
                h-7 px-2.5 rounded-full text-[11px] font-bold
                liquid-glass transition-colors cursor-pointer
                ${d ? "text-white/80" : "text-[#1C1C1E]/80"}
              `}
            >
              {currency === "UZS" ? "СУМ" : "USD"}
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              transition={tapSpring}
              onClick={() => setTheme(d ? "light" : "dark")}
              className="w-7 h-7 rounded-full flex items-center justify-center liquid-glass transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun size={13} className="text-yellow-400" />
              ) : (
                <Moon size={13} className="text-[#1C1C1E]" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT AREA BASED ON ACTIVE NAV TAB
          ═══════════════════════════════════════════════════ */}
      <main className="px-4 pt-3 min-h-[70vh]">
        {/* ══════════ 1. TAB: CATALOG (ГЛАВНАЯ) ══════════ */}
        {navTab === "catalog" && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Trade-In Express Banner */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={tapSpring}
              onClick={() => setIsTradeInOpen(true)}
              className={`w-full rounded-3xl relative overflow-hidden cursor-pointer ${
                d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"
              } backdrop-blur-lg border group transition-all`}
            >
              <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
                d ? "via-white/25" : "via-black/10"
              } to-transparent pointer-events-none`} />
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-gradient-to-br from-[#0A84FF]/25 to-[#0058CA]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="p-4 relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#2997FF]">
                      <ArrowLeftRight size={10} />
                    </div>
                    <span className="text-[#2997FF] text-[10px] font-bold uppercase tracking-wider">
                      Trade-in Express
                    </span>
                  </div>
                  <h3 className={`text-[15px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                    {lang === "RU" ? "Обменяйте старое на новое" : "Eskisini yangisiga almashtiring"}
                  </h3>
                  <p className={`text-[11px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
                    {lang === "RU" ? "5 бесплатных расчетов за 1 минуту" : "1 daqiqada 5 ta bepul hisob"}
                  </p>
                </div>

                <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white text-[11px] font-bold shadow-[0_4px_12px_rgba(10,132,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)] border border-white/20">
                  {lang === "RU" ? "Оценить →" : "Baholash →"}
                </span>
              </div>
            </motion.div>

            {/* Unified Top Catalog Search with Grid/List switcher */}
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all ${
                  d
                    ? "bg-white/[0.05] border-white/10 text-white focus-within:border-white/25 shadow-sm"
                    : "bg-black/[0.03] border-black/10 text-[#1C1C1E] focus-within:border-black/20"
                }`}
              >
                <Search size={15} className={d ? "text-white/40" : "text-black/40"} />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={
                    catalogSubTab === "new"
                      ? lang === "RU"
                        ? "Поиск модели (iPhone 16 Pro, 15...)"
                        : "Model qidirish (iPhone 16 Pro...)"
                      : lang === "RU"
                      ? "Поиск Б/У (iPhone 15 Pro, 14, 13...)"
                      : "B/U qidirish (iPhone 15 Pro...)"
                  }
                  className="bg-transparent text-[13px] outline-none flex-1 placeholder:text-inherit/30"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch("")} className="cursor-pointer">
                    <X size={14} className="opacity-50 hover:opacity-100" />
                  </button>
                )}
              </div>

              {/* View mode switcher (List / Grid) only when in Used view */}
              {catalogSubTab === "used" && (
                <div
                  className={`p-1 rounded-2xl border flex items-center gap-0.5 ${
                    d ? "bg-white/[0.05] border-white/10" : "bg-black/[0.03] border-black/10"
                  }`}
                >
                  <button
                    onClick={() => setUsedViewMode("list")}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      usedViewMode === "list"
                        ? "bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white shadow-sm"
                        : "opacity-40"
                    }`}
                  >
                    <List size={15} />
                  </button>
                  <button
                    onClick={() => setUsedViewMode("grid")}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      usedViewMode === "grid"
                        ? "bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white shadow-sm"
                        : "opacity-40"
                    }`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Sub-segmented control: New vs Used */}
            <div
              className={`flex p-[3px] rounded-full relative ${
                d ? "bg-white/[0.04] border border-white/[0.06]" : "bg-black/[0.04] border border-black/[0.04]"
              }`}
            >
              <button
                onClick={() => setCatalogSubTab("new")}
                className={`relative flex-1 py-2 text-[13px] font-bold rounded-full transition-colors z-10 cursor-pointer ${
                  catalogSubTab === "new" ? "text-white" : d ? "text-white/40" : "text-[#1C1C1E]/40"
                }`}
              >
                {catalogSubTab === "new" && (
                  <motion.div
                    layoutId="subTabHighlight"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] shadow-[0_4px_16px_rgba(10,132,255,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.4)] border border-white/20"
                  />
                )}
                <span className="relative z-10">{lang === "RU" ? "Новые устройства" : "Yangi qurilmalar"}</span>
              </button>

              <button
                onClick={() => setCatalogSubTab("used")}
                className={`relative flex-1 py-2 text-[13px] font-bold rounded-full transition-colors z-10 cursor-pointer ${
                  catalogSubTab === "used" ? "text-white" : d ? "text-white/40" : "text-[#1C1C1E]/40"
                }`}
              >
                {catalogSubTab === "used" && (
                  <motion.div
                    layoutId="subTabHighlight"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] shadow-[0_4px_16px_rgba(10,132,255,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.4)] border border-white/20"
                  />
                )}
                <span className="relative z-10">{lang === "RU" ? "Б/У с гарантией" : "Kafolatli B/U"}</span>
              </button>
            </div>

            {/* ── SUB-VIEW: NEW PRODUCTS ── */}
            {catalogSubTab === "new" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {filteredNewProducts.length > 0 ? (
                  filteredNewProducts.map((p: any) => {
                    const minPrice = p.variants?.length
                      ? Math.min(...p.variants.map((v: any) => v.price))
                      : p.basePrice;

                    return (
                      <motion.div
                        key={p.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedProduct(p)}
                        className={`rounded-3xl p-3.5 flex flex-col cursor-pointer border relative overflow-hidden transition-all group ${
                          d
                            ? "bg-white/5 border-white/10 hover:border-white/20 shadow-xl"
                            : "bg-white border-black/10 hover:border-black/20 shadow-sm"
                        }`}
                      >
                        <div className="w-full h-28 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden">
                          <img
                            src={(() => { try { const imgs = p.images ? JSON.parse(p.images) : []; return imgs[0] || getModelPhoto(p.title); } catch { return getModelPhoto(p.title); } })()}
                            alt={p.title}
                            className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = "/products/iphone15pro_1.webp";
                            }}
                          />
                        </div>
                        <h4 className={`text-[13px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                          {p.title}
                        </h4>
                        <p className="text-[10px] text-emerald-400 font-semibold mb-1">
                          {lang === "RU" ? "Новый • В наличии" : "Yangi • Mavjud"}
                        </p>
                        <p className={`text-[14px] font-black tracking-tight mt-auto ${d ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : "text-[#1C1C1E]"}`}>
                          {fmtPrice(minPrice, shop.currencyRate, currency)}
                        </p>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 text-white/40 text-[13px]">
                    {lang === "RU" ? "Устройств не найдено" : "Qurilmalar topilmadi"}
                  </div>
                )}
              </div>
            )}

            {/* ── SUB-VIEW: USED PRODUCTS (WITH CHIPS & RICH TELEGRAM CARD STYLE) ── */}
            {catalogSubTab === "used" && (
              <div className="space-y-3 pt-1">
                {/* Battery Health filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                    АКБ:
                  </span>
                  {[
                    { id: "all", label: "Все" },
                    { id: "95+", label: "95-100%" },
                    { id: "90+", label: "90-94%" },
                    { id: "80+", label: "80-89%" },
                    { id: "70+", label: "70-79%" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setUsedBatteryFilter(b.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        usedBatteryFilter === b.id
                          ? "bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white shadow-sm border border-white/20"
                          : d
                          ? "bg-white/5 text-white/60 hover:bg-white/10"
                          : "bg-black/5 text-[#1C1C1E]/60 hover:bg-black/10"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {/* Storage filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                    Память:
                  </span>
                  {["all", "128GB", "256GB", "512GB", "1TB"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setUsedStorageFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        usedStorageFilter === s
                          ? "bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white shadow-sm border border-white/20"
                          : d
                          ? "bg-white/5 text-white/60 hover:bg-white/10"
                          : "bg-black/5 text-[#1C1C1E]/60 hover:bg-black/10"
                      }`}
                    >
                      {s === "all" ? "Все" : s}
                    </button>
                  ))}
                </div>

                {/* Used Products List / Grid */}
                {filteredUsedProducts.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-[13px]">
                    {lang === "RU" ? "Устройств по выбранным фильтрам не найдено" : "Tanlangan filtrlar bo'yicha qurilma topilmadi"}
                  </div>
                ) : usedViewMode === "grid" ? (
                  /* Grid View (2 cols) */
                  <div className="grid grid-cols-2 gap-3">
                    {filteredUsedProducts.map((p: any) => {
                      const region = p.region || "ZP/A";
                      const storage = extractStorage(p.title);
                      const m12Installment = Math.round((p.price * 0.7 * 1.25) / 12);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all group cursor-pointer hover:border-[#0A84FF]/40 active:scale-[0.98] ${
                            d ? "bg-white/5 border-white/10 hover:border-white/20 shadow-xl" : "bg-white border-black/10 hover:border-black/20 shadow-sm"
                          }`}
                        >
                          <div>
                            <div className="w-full h-24 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden">
                              <img
                                src={(() => { try { const imgs = p.images ? JSON.parse(p.images) : []; return imgs[0] || getModelPhoto(p.title); } catch { return getModelPhoto(p.title); } })()}
                                alt={p.title}
                                className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src = "/products/iphone15pro_1.webp";
                                }}
                              />
                            </div>
                            <h4 className={`text-[13px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                              {p.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1 mt-1 mb-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#0A84FF]/15 text-[#2997FF]">
                                🧠 {storage}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                                🔋 {p.batteryHealth}%
                              </span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${d ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"}`}>
                                🌏 {region}
                              </span>
                            </div>
                            {/* Installment preview */}
                            <p className="text-[10px] text-amber-400 font-semibold mb-1">
                              💳 Рассрочка от ${m12Installment}/мес
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2">
                            <span className={`text-[14px] font-black tracking-tight ${d ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : "text-[#1C1C1E]"}`}>
                              {fmtPrice(p.price, shop.currencyRate, currency)}
                            </span>
                            <button
                              disabled={isBookingLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookProduct(p);
                              }}
                              className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-[0_4px_14px_rgba(10,132,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)] transition-all bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] text-white cursor-pointer border border-white/20 active:scale-[0.97]"
                            >
                              <Clock size={12} />
                              <span>{lang === "RU" ? "Забронировать" : "Band qilish"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Detailed List View (Rich Telegram Post Style) */
                  <div className="space-y-3">
                    {filteredUsedProducts.map((p: any) => {
                      const region = p.region || "ZP/A";
                      const storage = extractStorage(p.title);
                      const m12Installment = Math.round((p.price * 0.7 * 1.25) / 12);
                      const initialDeposit = Math.round(p.price * 0.3);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className={`p-4 rounded-3xl border flex gap-3.5 transition-all group cursor-pointer hover:border-[#0A84FF]/40 active:scale-[0.99] ${
                            d ? "bg-white/5 border-white/10 hover:border-white/20 shadow-xl" : "bg-white border-black/10 hover:border-black/20 shadow-sm"
                          }`}
                        >
                          <div className={`w-[84px] h-[104px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${d ? "bg-white/[0.02]" : "bg-black/[0.02]"}`}>
                            <img
                              src={(() => { try { const imgs = p.images ? JSON.parse(p.images) : []; return imgs[0] || getModelPhoto(p.title); } catch { return getModelPhoto(p.title); } })()}
                              alt={p.title}
                              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = "/products/iphone15pro_1.webp";
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-[14px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                                  {p.title}
                                </h4>
                                <span className="text-[10px] font-semibold text-emerald-400 shrink-0">
                                  🛠️ {lang === "RU" ? "Идеал" : "Ideal"}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0A84FF]/15 text-[#2997FF] border border-[#0A84FF]/20">
                                  🧠 {storage}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                  🔋 {p.batteryHealth}% АКБ
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${d ? "bg-white/5 text-white/70" : "bg-black/5 text-[#1C1C1E]/70"}`}>
                                  🌏 Region {region}
                                </span>
                                {p.hasBox && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${d ? "bg-white/5 text-white/70" : "bg-black/5 text-[#1C1C1E]/70"}`}>
                                    📦 {lang === "RU" ? "Коробка" : "Quti"}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#2997FF]/10 text-[#2997FF]">
                                  📝 {lang === "RU" ? "Гарантия" : "Kafolat"}
                                </span>
                              </div>

                              {/* Installment terms */}
                              <div className="mt-1 text-[11px] text-amber-400 font-medium">
                                💳 Рассрочка: взнос ${initialDeposit} • ${m12Installment}/мес
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                              <span className={`text-[16px] font-black tracking-tight ${d ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : "text-[#1C1C1E]"}`}>
                                {fmtPrice(p.price, shop.currencyRate, currency)}
                              </span>
                              <button
                                disabled={isBookingLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookProduct(p);
                                }}
                                className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-[0_4px_14px_rgba(10,132,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)] transition-all bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] text-white cursor-pointer border border-white/20 active:scale-[0.97]"
                              >
                                <Clock size={13} />
                                <span>{lang === "RU" ? "Забронировать" : "Band qilish"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════ 2. TAB: BOOKINGS (БРОНИ) ══════════ */}
        {navTab === "bookings" && (
          <div className="animate-in fade-in duration-200">
            <BookingsTab
              user={authUser}
              isDark={d}
              lang={lang}
              currency={currency}
              currencyRate={shop.currencyRate}
              onNavigateToUsed={() => {
                setNavTab("catalog");
                setCatalogSubTab("used");
              }}
            />
          </div>
        )}

        {/* ══════════ 3. TAB: PROFILE (ПРОФИЛЬ) ══════════ */}
        {navTab === "profile" && (
          <div className="pb-24 space-y-4 animate-in fade-in duration-200">
            <div className={`w-full rounded-3xl p-6 ${d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"} backdrop-blur-lg border relative overflow-hidden flex flex-col items-center text-center`}>
              <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${d ? "via-white/25" : "via-black/10"} to-transparent pointer-events-none`} />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0A84FF]/20 rounded-full blur-2xl pointer-events-none" />

              {/* Avatar Photo with no-referrer policy */}
              <div className="relative mb-3">
                {!avatarFailed && userAvatarSrc ? (
                  <img
                    src={userAvatarSrc}
                    alt={authUser?.name || telegramUser?.firstName || "User"}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A84FF] via-[#0071E3] to-[#7928CA] flex items-center justify-center text-white text-2xl font-black border-2 border-white/20 shadow-lg shadow-blue-500/20">
                    {(authUser?.name || telegramUser?.firstName || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#34C759] border-2 border-[#07070b] flex items-center justify-center shadow-md">
                  <Check size={12} className="text-white stroke-[3]" />
                </div>
              </div>

              {/* Name */}
              <h2 className={`text-[19px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"} flex items-center gap-1.5`}>
                <span>{authUser?.name || telegramUser?.firstName || (lang === "RU" ? "Пользователь" : "Foydalanuvchi")}</span>
                {(authUser?.isPremium || telegramUser?.isPremium) && (
                  <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                    ★ PRO
                  </span>
                )}
              </h2>

              {/* Username & ID */}
              <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"} mt-0.5 mb-2 font-mono flex items-center justify-center gap-2 flex-wrap`}>
                {telegramUser?.username && <span>@{telegramUser.username}</span>}
                {telegramUser?.username && (authUser?.telegramId || telegramUser?.telegramId) && <span>•</span>}
                <span>ID: {authUser?.telegramId || telegramUser?.telegramId || "—"}</span>
              </p>

              {/* Verified Phone Badge */}
              {authUser?.phone && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${d ? "bg-white/5 border-white/10 text-white/80" : "bg-black/5 border-black/10 text-[#1C1C1E]/80"} text-[12px] font-mono mb-4 backdrop-blur-md`}>
                  <Phone size={12} className="text-[#34C759]" />
                  <span>{authUser.phone}</span>
                </div>
              )}

              {/* Stats Row */}
              <div className="w-full grid grid-cols-2 gap-3 mb-4">
                <div
                  onClick={() => setNavTab("bookings")}
                  className={`cursor-pointer ${d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"} border rounded-2xl p-3 text-left backdrop-blur-md hover:border-[#2997FF]/40 transition-all`}
                >
                  <div className={`flex items-center gap-1.5 ${d ? "text-white/50" : "text-[#1C1C1E]/50"} text-[11px] mb-1 font-medium`}>
                    <Clock size={12} className="text-[#2997FF]" />
                    <span>{lang === "RU" ? "Мои брони" : "Bandlovlar"}</span>
                  </div>
                  <p className={`text-[17px] font-extrabold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                    {authUser?.bookings?.filter((b: any) => Boolean(b.usedProductId || b.usedProduct))?.length || 0}
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

              {/* Quick Actions */}
              <div className="w-full space-y-2">
                <button
                  onClick={() => setIsTradeInOpen(true)}
                  className={`w-full py-3 rounded-2xl ${
                    d ? "bg-white/10 hover:bg-white/15 text-white" : "bg-black/5 hover:bg-black/10 text-[#1C1C1E]"
                  } text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
                >
                  <ArrowLeftRight size={15} className="text-[#2997FF]" />
                  <span>{lang === "RU" ? "Калькулятор Trade-In" : "Trade-In kalkulyatori"}</span>
                </button>

                <a
                  href="https://t.me/Prostoreuzb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-2xl ${
                    d ? "bg-white/5 hover:bg-white/10 text-white/80" : "bg-black/[0.03] hover:bg-black/[0.06] text-[#1C1C1E]/80"
                  } text-[13px] font-semibold flex items-center justify-center gap-2 transition-all`}
                >
                  <MessageCircle size={15} className="text-[#34C759]" />
                  <span>{lang === "RU" ? "Поддержка в Telegram" : "Telegram qo'llab-quvvatlash"} (@Prostoreuzb)</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ 4. TAB: SETTINGS (НАСТРОЙКИ) ══════════ */}
        {navTab === "settings" && (
          <div className="animate-in fade-in duration-200">
            <SettingsTab
              user={authUser}
              telegramUser={telegramUser}
              isDark={d}
              lang={lang}
              onLangChange={handleLangChange}
              onThemeChange={(th) => setTheme(th)}
              currentTheme={theme || "system"}
              onNameUpdate={handleNameUpdate}
              onShowToast={(msg, typ) => setToastState({ message: msg, visible: true, type: typ })}
            />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════
          STREAMLINED 4-TAB LIQUID GLASS BOTTOM NAVIGATION BAR
          ═══════════════════════════════════════════════════ */}
      <BottomNavBar
        activeTab={navTab}
        onTabChange={setNavTab}
        isDark={d}
        lang={lang}
        bookingsCount={
          authUser?.bookings?.filter((b: any) => Boolean(b.usedProductId || b.usedProduct))?.length || 0
        }
      />

      {/* ═══════════════════════════════════════════════════
          PRODUCT BOTTOM SHEET (NEW PRODUCT CONFIGURATOR & MULTI-PHOTO)
          ═══════════════════════════════════════════════════ */}
      <ProductBottomSheet
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        isDark={d}
        lang={lang}
        currency={currency}
        currencyRate={shop.currencyRate}
        onBook={handleBookProduct}
        isBookingLoading={isBookingLoading}
      />

      {/* ═══════════════════════════════════════════════════
          TRADE-IN CALCULATOR (5 FREE ATTEMPTS)
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
        isOpen={needsPhone && !isAuthLoading && !dismissedOnboarding}
        telegramUser={telegramUser}
        onRegister={registerWithPhone}
        onClose={() => setDismissedOnboarding(true)}
        onSuccess={() => {
          setDismissedOnboarding(true);
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
