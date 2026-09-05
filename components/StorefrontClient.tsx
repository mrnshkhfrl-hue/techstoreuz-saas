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
  Search,
  LayoutGrid,
  List,
  Trash2,
  ArrowRight,
  MapPin,
  X,
} from "lucide-react";
import ProductBottomSheet from "@/components/ProductBottomSheet";
import TradeInCalculator from "@/components/TradeInCalculator";
import OnboardingModal from "@/components/OnboardingModal";
import Toast from "@/components/Toast";
import BottomNavBar, { NavTab } from "@/components/BottomNavBar";
import SettingsTab from "@/components/SettingsTab";
import BookingsTab from "@/components/BookingsTab";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useCart } from "@/providers/CartProvider";
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

  // Main 5-tab navigation state
  const [navTab, setNavTab] = useState<NavTab>("catalog");

  // Catalog sub-tab: New vs Used
  const [catalogSubTab, setCatalogSubTab] = useState<"new" | "used">("new");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Used products filters & view mode
  const [usedViewMode, setUsedViewMode] = useState<"grid" | "list">("list");
  const [usedSearch, setUsedSearch] = useState("");
  const [usedBatteryFilter, setUsedBatteryFilter] = useState("all");
  const [usedStorageFilter, setUsedStorageFilter] = useState("all");

  const [currency, setCurrency] = useState<"USD" | "UZS">("UZS");
  const [lang, setLang] = useState<"RU" | "UZ">("RU");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  /* ── Live Hooks (Auth & Cart) ── */
  const {
    user: authUser,
    telegramUser,
    isLoading: isAuthLoading,
    needsPhone,
    registerWithPhone,
    refetch,
  } = useTelegramAuth();
  const { items, removeItem, clearCart, addItem, itemCount, totalPrice } = useCart();

  const [toastState, setToastState] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({ message: "", visible: false, type: "success" });

  /* ── Filtered New Products ── */
  const filteredNewProducts = useMemo(() => {
    if (!shop.newProducts) return [];
    if (!catalogSearch.trim()) return shop.newProducts;
    const q = catalogSearch.toLowerCase();
    return shop.newProducts.filter((p: any) => p.title.toLowerCase().includes(q));
  }, [shop.newProducts, catalogSearch]);

  /* ── Filtered Used Products (Hides Booked Devices!) ── */
  const filteredUsedProducts = useMemo(() => {
    if (!shop.usedProducts) return [];
    return shop.usedProducts.filter((p: any) => {
      // Hide already booked devices from public catalog!
      if (p.status === "BOOKED") return false;

      // Search (global catalogSearch OR usedSearch)
      const effectiveSearch = (catalogSearch.trim() || usedSearch.trim()).toLowerCase();
      if (effectiveSearch && !p.title.toLowerCase().includes(effectiveSearch)) {
        return false;
      }

      // Battery
      if (usedBatteryFilter === "95+") {
        if (p.batteryHealth < 95) return false;
      } else if (usedBatteryFilter === "90+") {
        if (p.batteryHealth < 90 || p.batteryHealth >= 95) return false;
      } else if (usedBatteryFilter === "80+") {
        if (p.batteryHealth < 80 || p.batteryHealth >= 90) return false;
      } else if (usedBatteryFilter === "70+") {
        if (p.batteryHealth < 70 || p.batteryHealth >= 80) return false;
      }

      // Storage
      if (usedStorageFilter !== "all") {
        if (!p.title.toLowerCase().includes(usedStorageFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [shop.usedProducts, catalogSearch, usedSearch, usedBatteryFilter, usedStorageFilter]);

  /* ── 1-Click Direct Booking on Used Device ── */
  const handleBookUsedProduct = async (product: any) => {
    if (!authUser?.phone) {
      setSelectedProduct(product);
      return;
    }

    setIsBookingLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          telegramId: authUser.telegramId,
          phone: authUser.phone,
          items: [{ type: "USED", id: product.id }],
        }),
      });

      if (res.ok) {
        setToastState({
          message:
            lang === "RU"
              ? `Заявка отправлена! Менеджер свяжется с вами для подтверждения брони.`
              : `Ariza yuborildi! Menejer tasdiqlash uchun siz bilan bog'lanadi.`,
          visible: true,
          type: "success",
        });
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

  /* ── Cart Checkout ── */
  const handleCartCheckout = async () => {
    if (!authUser?.phone) {
      setToastState({
        message:
          lang === "RU"
            ? "Пожалуйста, привяжите номер телефона в профиле"
            : "Iltimos, profilingizda telefon raqamini biriktiring",
        visible: true,
        type: "error",
      });
      return;
    }

    try {
      const bookingItems = items.map((it) => ({
        type: it.type,
        id: it.id,
      }));

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          telegramId: authUser.telegramId,
          phone: authUser.phone,
          items: bookingItems,
        }),
      });

      if (res.ok) {
        clearCart();
        setToastState({
          message:
            lang === "RU"
              ? "Заявка принята! Менеджер свяжется с вами для подтверждения заказа."
              : "Buyurtma qabul qilindi! Menejer tasdiqlash uchun siz bilan bog'lanadi.",
          visible: true,
          type: "success",
        });
        await refetch();
        setNavTab("bookings");
      }
    } catch (err: any) {
      setToastState({
        message: err.message || "Ошибка оформления заказа",
        visible: true,
        type: "error",
      });
    }
  };

  return (
    <div
      className={`max-w-[430px] mx-auto min-h-screen relative font-sans ${
        d ? "text-white sm:border-white/10" : "text-[#1C1C1E] sm:border-black/10"
      } bg-transparent sm:border-x transition-colors duration-200 pb-20`}
    >
      {/* ═══════════════════════════════════════════════════
          HEADER — Minimal Liquid Glass
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
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Trade-In Banner */}
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
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#007AFF]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="p-4 relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/30 flex items-center justify-center text-[#007AFF]">
                      <ArrowLeftRight size={10} />
                    </div>
                    <span className="text-[#007AFF] text-[10px] font-bold uppercase tracking-wider">
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

                <span className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] text-white text-[11px] font-bold shadow-md shadow-[#007AFF]/25">
                  {lang === "RU" ? "Оценить →" : "Baholash →"}
                </span>
              </div>
            </motion.div>

            {/* Universal Catalog Search */}
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${
              d ? "bg-white/5 border-white/10 text-white" : "bg-black/[0.03] border-black/10 text-[#1C1C1E]"
            }`}>
              <Search size={15} className={d ? "text-white/40" : "text-black/40"} />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={lang === "RU" ? "Поиск по каталогу (iPhone 15, 14 Pro...)" : "Katalog bo'yicha qidirish..."}
                className="bg-transparent text-[13px] outline-none flex-1 placeholder:text-inherit/30"
              />
              {catalogSearch && (
                <button onClick={() => setCatalogSearch("")} className="cursor-pointer">
                  <X size={14} className="opacity-50 hover:opacity-100" />
                </button>
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
                    className="absolute inset-0 rounded-full bg-[#007AFF] shadow-lg shadow-[#007AFF]/25"
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
                    className="absolute inset-0 rounded-full bg-[#007AFF] shadow-lg shadow-[#007AFF]/25"
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
                            src={getModelPhoto(p.title)}
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
                        <p className="text-[14px] font-extrabold text-[#007AFF] mt-auto">
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

              {/* ── SUB-VIEW: USED PRODUCTS (WITH FILTERS & GRID/LIST SWITCH) ── */}
              {catalogSubTab === "used" && (
                <div className="space-y-3 pt-1">
                  {/* Search and Grid/List toggle bar */}
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl border ${
                      d ? "bg-white/5 border-white/10 text-white" : "bg-black/[0.03] border-black/10 text-[#1C1C1E]"
                    }`}>
                      <Search size={14} className={d ? "text-white/40" : "text-black/40"} />
                      <input
                        type="text"
                        value={usedSearch}
                        onChange={(e) => setUsedSearch(e.target.value)}
                        placeholder={lang === "RU" ? "Поиск модели (iPhone 14...)" : "Model qidirish..."}
                        className="bg-transparent text-[12px] outline-none flex-1 placeholder:text-inherit/30"
                      />
                      {usedSearch && (
                        <button onClick={() => setUsedSearch("")} className="cursor-pointer">
                          <X size={13} className="opacity-50 hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* View Switcher */}
                    <div className={`p-1 rounded-2xl border flex items-center gap-0.5 ${
                      d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"
                    }`}>
                      <button
                        onClick={() => setUsedViewMode("list")}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          usedViewMode === "list" ? "bg-[#007AFF] text-white shadow-sm" : "opacity-40"
                        }`}
                      >
                        <List size={14} />
                      </button>
                      <button
                        onClick={() => setUsedViewMode("grid")}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          usedViewMode === "grid" ? "bg-[#007AFF] text-white shadow-sm" : "opacity-40"
                        }`}
                      >
                        <LayoutGrid size={14} />
                      </button>
                    </div>
                  </div>

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
                            ? "bg-[#007AFF] text-white shadow-sm"
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
                            ? "bg-[#007AFF] text-white shadow-sm"
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
                      {filteredUsedProducts.map((p: any) => (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all group ${
                            d ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-sm"
                          }`}
                        >
                          <div>
                            <div className="w-full h-24 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden">
                              <img
                                src={getModelPhoto(p.title)}
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
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF]">
                                💾 {extractStorage(p.title)}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#34C759]/15 text-[#34C759]">
                                🔋 {p.batteryHealth}%
                              </span>
                              {p.region && (
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${d ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"}`}>
                                  {p.region}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2">
                            <span className="text-[13px] font-extrabold text-[#007AFF]">
                              {fmtPrice(p.price, shop.currencyRate, currency)}
                            </span>
                            <button
                              disabled={isBookingLoading}
                              onClick={() => handleBookUsedProduct(p)}
                              className="w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all bg-[#007AFF] text-white hover:bg-[#007AFF]/90 cursor-pointer shadow-[#007AFF]/20"
                            >
                              <Clock size={12} />
                              <span>{lang === "RU" ? "Забронировать" : "Band qilish"}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Detailed List View */
                    <div className="space-y-3">
                      {filteredUsedProducts.map((p: any) => (
                        <div
                          key={p.id}
                          className={`p-4 rounded-3xl border flex gap-3.5 transition-all group ${
                            d ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-sm"
                          }`}
                        >
                          <div className={`w-[76px] h-[92px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${d ? "bg-white/[0.02]" : "bg-black/[0.02]"}`}>
                            <img
                              src={getModelPhoto(p.title)}
                              alt={p.title}
                              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = "/products/iphone15pro_1.webp";
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <h4 className={`text-[14px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                                {p.title}
                              </h4>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF]">
                                  💾 {extractStorage(p.title)}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#34C759]/15 text-[#34C759]">
                                  🔋 {p.batteryHealth}% АКБ
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${d ? "bg-white/5 text-white/60" : "bg-black/5 text-[#1C1C1E]/60"}`}>
                                  🌍 {p.region}
                                </span>
                                {p.hasBox && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${d ? "bg-white/5 text-white/60" : "bg-black/5 text-[#1C1C1E]/60"}`}>
                                    📦 {lang === "RU" ? "Коробка" : "Quti"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                              <span className="text-[15px] font-extrabold text-[#007AFF]">
                                {fmtPrice(p.price, shop.currencyRate, currency)}
                              </span>
                              <button
                                disabled={isBookingLoading}
                                onClick={() => handleBookUsedProduct(p)}
                                className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md transition-all bg-[#007AFF] text-white hover:bg-[#007AFF]/90 cursor-pointer shadow-[#007AFF]/25"
                              >
                                <Clock size={12} />
                                <span>{lang === "RU" ? "Забронировать" : "Band qilish"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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

          {/* ══════════ 3. TAB: CART (КОРЗИНА) ══════════ */}
          {navTab === "cart" && (
            <div className="space-y-4 pb-24 animate-in fade-in duration-200">
              <div className="px-1">
                <h2 className={`text-[20px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                  {lang === "RU" ? "Корзина покупок" : "Xaridlar savati"}
                </h2>
                <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
                  {lang === "RU" ? "Выбранные устройства и оформление заказа" : "Tanlangan qurilmalar va buyurtma berish"}
                </p>
              </div>

              {items.length === 0 ? (
                <div className={`p-8 rounded-[24px] text-center flex flex-col items-center justify-center space-y-3 border ${
                  d ? "bg-white/[0.03] border-white/10" : "bg-white border-black/10 shadow-sm"
                }`}>
                  <div className="w-14 h-14 rounded-full bg-[#007AFF]/15 flex items-center justify-center text-[#007AFF]">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className={`text-[15px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                    {lang === "RU" ? "Корзина пуста" : "Savat bo'sh"}
                  </h3>
                  <p className={`text-[12px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"} max-w-[220px]`}>
                    {lang === "RU" ? "Добавьте устройства из каталога для оформления" : "Buyurtma berish uchun katalogdan tovar qo'shing"}
                  </p>
                  <button
                    onClick={() => setNavTab("catalog")}
                    className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] font-bold shadow-md shadow-[#007AFF]/25 cursor-pointer"
                  >
                    {lang === "RU" ? "Перейти в каталог" : "Katalogga o'tish"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        d ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-sm"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className={`text-[13px] font-bold truncate ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                          {it.title}
                        </h4>
                        {it.variant && (
                          <p className={`text-[11px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"} truncate`}>
                            {it.variant}
                          </p>
                        )}
                        <p className="text-[13px] font-extrabold text-[#007AFF] mt-1">
                          {fmtPrice(it.price, shop.currencyRate, currency)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(it.id)}
                        className="p-2 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Summary & Checkout Card */}
                  <div className={`p-4 rounded-3xl border space-y-3 ${
                    d ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] ${d ? "text-white/60" : "text-[#1C1C1E]/60"}`}>
                        {lang === "RU" ? "Итого к оплате:" : "Jami to'lov:"}
                      </span>
                      <span className={`text-[18px] font-black ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                        {fmtPrice(totalPrice, shop.currencyRate, currency)}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border text-[12px] space-y-1 ${
                      d ? "bg-white/[0.02] border-white/5 text-white/70" : "bg-black/[0.02] border-black/5 text-[#1C1C1E]/70"
                    }`}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin size={13} className="text-[#FF2D55]" />
                        <span>{lang === "RU" ? "Самовывоз: г. Самарканд, ул. Гульабад, 1" : "Olib ketish: Samarqand sh., Gulobod ko'chasi, 1"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone size={12} className="text-[#34C759]" />
                        <span>{authUser?.phone || "+998 77 285-99-99"}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCartCheckout}
                      className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-[14px] font-bold shadow-lg shadow-[#007AFF]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      <span>{lang === "RU" ? "Оформить заказ в магазине" : "Do'konda buyurtma berish"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ 4. TAB: PROFILE (ПРОФИЛЬ) ══════════ */}
          {navTab === "profile" && (
            <div className="pb-24 space-y-4 animate-in fade-in duration-200">
              <div className={`w-full rounded-3xl p-6 ${d ? "bg-white/5 border-white/10 shadow-xl" : "bg-white border-black/10 shadow-md"} backdrop-blur-lg border relative overflow-hidden flex flex-col items-center text-center`}>
                <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${d ? "via-white/25" : "via-black/10"} to-transparent pointer-events-none`} />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-2xl pointer-events-none" />

                {/* Avatar Photo */}
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
                    className={`cursor-pointer ${d ? "bg-white/5 border-white/10" : "bg-black/[0.03] border-black/10"} border rounded-2xl p-3 text-left backdrop-blur-md hover:border-[#007AFF]/40 transition-all`}
                  >
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

                {/* Quick Actions */}
                <div className="w-full space-y-2">
                  <button
                    onClick={() => setIsTradeInOpen(true)}
                    className={`w-full py-3 rounded-2xl ${
                      d ? "bg-white/10 hover:bg-white/15 text-white" : "bg-black/5 hover:bg-black/10 text-[#1C1C1E]"
                    } text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
                  >
                    <ArrowLeftRight size={15} className="text-[#007AFF]" />
                    <span>{lang === "RU" ? "Калькулятор Trade-In" : "Trade-In kalkulyatori"}</span>
                  </button>

                  <a
                    href="https://t.me/mrnshkx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 rounded-2xl ${
                      d ? "bg-white/5 hover:bg-white/10 text-white/80" : "bg-black/[0.03] hover:bg-black/[0.06] text-[#1C1C1E]/80"
                    } text-[13px] font-semibold flex items-center justify-center gap-2 transition-all`}
                  >
                    <MessageCircle size={15} className="text-[#34C759]" />
                    <span>{lang === "RU" ? "Поддержка в Telegram" : "Telegram qo'llab-quvvatlash"} (@mrnshkx)</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ 5. TAB: SETTINGS (НАСТРОЙКИ) ══════════ */}
          {navTab === "settings" && (
            <div className="animate-in fade-in duration-200">
              <SettingsTab
                user={authUser}
                telegramUser={telegramUser}
                isDark={d}
                lang={lang}
                onLangChange={setLang}
                onThemeChange={(th) => setTheme(th)}
                currentTheme={theme || "system"}
                onNameUpdate={handleNameUpdate}
                onShowToast={(msg, typ) => setToastState({ message: msg, visible: true, type: typ })}
              />
            </div>
          )}
      </main>

      {/* ═══════════════════════════════════════════════════
          LIQUID GLASS BOTTOM NAVIGATION BAR
          ═══════════════════════════════════════════════════ */}
      <BottomNavBar
        activeTab={navTab}
        onTabChange={setNavTab}
        isDark={d}
        lang={lang}
        cartCount={itemCount}
        bookingsCount={authUser?.bookings?.length || 0}
      />

      {/* ═══════════════════════════════════════════════════
          PRODUCT BOTTOM SHEET (NEW PRODUCT CONFIGURATOR)
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
