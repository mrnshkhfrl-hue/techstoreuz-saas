"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Smartphone,
  HardDrive,
  Battery,
  Box,
  AlertCircle,
  Fingerprint,
  Bookmark,
  ShieldCheck,
  Cpu,
  Camera,
  Layers,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";
import { getModelPhotos, extractStorage } from "@/lib/product-images";
import { getDeviceSpecs, STORE_MANAGERS, STORE_TELEGRAM } from "@/lib/device-specs";

interface ProductBottomSheetProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  currency: "USD" | "UZS";
  currencyRate: number;
  lang: "RU" | "UZ";
  onBook?: (product: any, variant?: any) => Promise<void>;
  isBookingLoading?: boolean;
}

function fmtPrice(usd: number, rate: number, currency: "USD" | "UZS"): string {
  if (currency === "USD") return `$${usd.toLocaleString("en-US")}`;
  const sum = Math.round(usd * rate);
  return `${sum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сум`;
}

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

export default function ProductBottomSheet({
  product,
  isOpen,
  onClose,
  isDark,
  currency,
  currencyRate,
  lang,
  onBook,
  isBookingLoading = false,
}: ProductBottomSheetProps) {
  const d = isDark;
  const { haptic } = useTelegram();

  const isNew = Boolean(
    product && ("variants" in product || "basePrice" in product) && !product.batteryHealth
  );

  /* Variant selectors for new products */
  const storageOptions = useMemo(() => {
    if (!isNew || !product?.variants) return [];
    return [...new Set(product.variants.map((v: any) => v.storage))] as string[];
  }, [product, isNew]);

  const colorOptions = useMemo(() => {
    if (!isNew || !product?.variants) return [];
    return [...new Set(product.variants.map((v: any) => v.color))] as string[];
  }, [product, isNew]);

  const simOptions = useMemo(() => {
    if (!isNew || !product?.variants) return [];
    return [...new Set(product.variants.map((v: any) => v.simType))] as string[];
  }, [product, isNew]);

  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSim, setSelectedSim] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  /* Auto-cascade filters */
  const filteredColorOptions = useMemo(() => {
    if (!isNew || !selectedStorage || !product?.variants) return colorOptions;
    const colors = [...new Set(
      product.variants
        .filter((v: any) => v.storage === selectedStorage)
        .map((v: any) => v.color)
    )] as string[];
    return colors.length > 0 ? colors : colorOptions;
  }, [product, isNew, selectedStorage, colorOptions]);

  const filteredSimOptions = useMemo(() => {
    if (!isNew || !selectedStorage || !selectedColor || !product?.variants) return simOptions;
    const sims = [...new Set(
      product.variants
        .filter((v: any) => v.storage === selectedStorage && v.color === selectedColor)
        .map((v: any) => v.simType)
    )] as string[];
    return sims.length > 0 ? sims : simOptions;
  }, [product, isNew, selectedStorage, selectedColor, simOptions]);

  useEffect(() => {
    setActiveSlide(0);
    if (isNew && product) {
      setSelectedStorage(storageOptions[0] || "");
      setSelectedColor(colorOptions[0] || "");
      setSelectedSim(simOptions[0] || "");
    }
  }, [product?.id]);

  useEffect(() => {
    if (isNew && selectedStorage && !filteredColorOptions.includes(selectedColor)) {
      setSelectedColor(filteredColorOptions[0] || "");
    }
  }, [selectedStorage, filteredColorOptions]);

  useEffect(() => {
    if (isNew && selectedColor && !filteredSimOptions.includes(selectedSim)) {
      setSelectedSim(filteredSimOptions[0] || "");
    }
  }, [selectedColor, filteredSimOptions]);

  const matchedVariant = useMemo(() => {
    if (!isNew || !product?.variants) return null;
    return product.variants.find(
      (v: any) =>
        v.storage === selectedStorage &&
        v.color === selectedColor &&
        v.simType === selectedSim
    );
  }, [product, isNew, selectedStorage, selectedColor, selectedSim]);

  const currentPrice = isNew
    ? matchedVariant?.price ?? product?.basePrice ?? 0
    : product?.price ?? 0;

  const inStock = matchedVariant ? matchedVariant.stock > 0 : true;

  // Multi-photo gallery resolution
  const galleryImages = useMemo(() => {
    if (!product) return [];
    let customImgs: string[] = [];
    try {
      if (product.images) {
        const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed) && parsed.length > 0) {
          customImgs = parsed;
        }
      }
    } catch {}
    return getModelPhotos(product.title, customImgs.length > 0 ? customImgs : undefined);
  }, [product]);

  // Specifications
  const specs = useMemo(() => {
    if (!product) return null;
    return getDeviceSpecs(product.title, currentPrice);
  }, [product?.title, currentPrice]);

  const handleBookClick = async () => {
    haptic.impactOccurred("medium");
    if (onBook) {
      await onBook(product, matchedVariant);
    }
    onClose();
  };

  /* Chip styles */
  const chipBase = d
    ? "bg-white/[0.06] text-white/60 border border-white/[0.08]"
    : "bg-black/[0.04] text-[#1C1C1E]/60 border border-black/[0.06]";

  const chipActive =
    "bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] text-white border border-white/20 shadow-md shadow-blue-500/25 font-bold";

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet — Apple Pro Liquid Glass */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 32,
            }}
            className={`
              fixed bottom-0 left-0 right-0
              mx-auto w-full max-w-[430px] z-[90]
              rounded-t-[32px] overflow-hidden
              ${d ? "bg-[#0b0c11]/95 border-white/10 text-white" : "bg-white/95 border-black/10 text-[#1C1C1E]"}
              backdrop-blur-3xl border-t border-x shadow-2xl
            `}
            style={{
              maxHeight: "92vh",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            <div className="overflow-y-auto max-h-[88vh] overscroll-contain">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sticky top-0 z-20 backdrop-blur-md bg-transparent">
                <div className={`w-10 h-[5px] rounded-full ${d ? "bg-white/20" : "bg-black/15"}`} />
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-5 pt-1 pb-3">
                <div>
                  <h3 className={`text-[18px] font-black tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                    {product.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Sparkles size={11} />
                    <span>{isNew ? (lang === "RU" ? "Оригинал Apple • Новый" : "Apple original • Yangi") : (lang === "RU" ? "Проверенный Б/У с гарантией" : "Tekshirilgan B/U")}</span>
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  transition={tapSpring}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center liquid-glass transition-colors cursor-pointer"
                >
                  <X size={16} className={d ? "text-white/60" : "text-[#1C1C1E]/60"} />
                </motion.button>
              </div>

              {/* ════════ Multi-photo Interactive Gallery (2-4 photos) ════════ */}
              <div className="px-5 pb-4">
                <div
                  className={`
                    w-full aspect-square rounded-[28px] relative overflow-hidden flex items-center justify-center border
                    ${d ? "bg-gradient-to-b from-white/[0.04] to-transparent border-white/[0.08]" : "bg-gradient-to-b from-black/[0.02] to-transparent border-black/[0.06]"}
                  `}
                >
                  {/* Photo Display with Animated Slide */}
                  <motion.img
                    key={activeSlide}
                    src={galleryImages[activeSlide] || "/products/iphone15pro_1.webp"}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    initial={{ opacity: 0.7, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-contain p-3 drop-shadow-2xl select-none pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.src = "/products/iphone15pro_1.webp";
                    }}
                  />

                  {/* Previous / Next Arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveSlide((s) => (s > 0 ? s - 1 : galleryImages.length - 1))}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setActiveSlide((s) => (s < galleryImages.length - 1 ? s + 1 : 0))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}

                  {/* Gallery Dots Indicator */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10">
                      {galleryImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlide(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            activeSlide === idx
                              ? "bg-[#2997FF] w-5 shadow-sm"
                              : d
                                ? "bg-white/30 w-1.5 hover:bg-white/50"
                                : "bg-black/20 w-1.5 hover:bg-black/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* 24-hour hold badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#2997FF]/15 border border-[#2997FF]/30 text-[#2997FF] text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                    <Clock size={11} />
                    <span>{lang === "RU" ? "Бронь 24 часа без предоплаты" : "Oldindan to'lovsiz 24 soat band"}</span>
                  </div>
                </div>
              </div>

              {/* ════════ NEW PRODUCT CONFIGURATOR ════════ */}
              {isNew && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Storage selector */}
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      {lang === "RU" ? "Объём памяти" : "Xotira hajmi"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((s) => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.95 }}
                          transition={tapSpring}
                          onClick={() => {
                            setSelectedStorage(s);
                            haptic.selectionChanged();
                          }}
                          className={`px-3.5 py-2 rounded-2xl text-[12px] font-semibold transition-all cursor-pointer ${
                            selectedStorage === s ? chipActive : chipBase
                          }`}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Color selector */}
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      {lang === "RU" ? "Цвет корпуса" : "Rang"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {filteredColorOptions.map((c) => (
                        <motion.button
                          key={c}
                          whileTap={{ scale: 0.95 }}
                          transition={tapSpring}
                          onClick={() => {
                            setSelectedColor(c);
                            haptic.selectionChanged();
                          }}
                          className={`px-3.5 py-2 rounded-2xl text-[12px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            selectedColor === c ? chipActive : chipBase
                          }`}
                        >
                          {selectedColor === c && <Check size={13} strokeWidth={3} />}
                          {c}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* SIM type selector */}
                  {filteredSimOptions.length > 1 && (
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                        {lang === "RU" ? "Тип SIM-карты" : "SIM turi"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {filteredSimOptions.map((s) => (
                          <motion.button
                            key={s}
                            whileTap={{ scale: 0.95 }}
                            transition={tapSpring}
                            onClick={() => {
                              setSelectedSim(s);
                              haptic.selectionChanged();
                            }}
                            className={`px-3.5 py-2 rounded-2xl text-[12px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              selectedSim === s ? chipActive : chipBase
                            }`}
                          >
                            <Fingerprint size={13} />
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ USED PRODUCT POST FORMAT DETAILS (UZBEK TELEGRAM STYLE) ════════ */}
              {!isNew && (
                <div className="px-5 pb-5 space-y-3">
                  <div className={`p-4 rounded-3xl border space-y-2.5 ${d ? "bg-white/[0.04] border-white/10" : "bg-black/[0.02] border-black/10"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2997FF]">
                        📋 {lang === "RU" ? "Паспорт устройства" : "Qurilma pasporti"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {lang === "RU" ? "Проверено сервис-центром" : "Servis tekshirgan"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] font-medium pt-1">
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5"}`}>
                        <span className="opacity-50 text-[10px] block">🌏 Регион / Region:</span>
                        <span className="font-bold">{product.region || "ZP/A (Global)"}</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5"}`}>
                        <span className="opacity-50 text-[10px] block">🧠 Память / Xotira:</span>
                        <span className="font-bold">{extractStorage(product.title)}</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5"}`}>
                        <span className="opacity-50 text-[10px] block">🔋 АКБ / Batareya:</span>
                        <span className="font-bold text-emerald-400">{product.batteryHealth}% АКБ</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5"}`}>
                        <span className="opacity-50 text-[10px] block">📦 Комплект / Quti:</span>
                        <span className="font-bold">{product.hasBox ? (lang === "RU" ? "Коробка есть" : "Quti bor") : (lang === "RU" ? "Без коробки" : "Qutisiz")}</span>
                      </div>
                    </div>

                    {/* Condition / Defects note */}
                    <div className={`p-3 rounded-2xl border flex items-center gap-2 ${d ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5"}`}>
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                      <div className="text-[12px]">
                        <span className="opacity-50 text-[10px] block">🛠️ Состояние / Holati:</span>
                        <span className="font-semibold">{product.defects || (lang === "RU" ? "Идеальное (без ремонта, все родное)" : "Ideal, ta'mir ko'rmagan")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ FULL TECH SPECS (AUTO-POPULATED FROM MODEL) ════════ */}
              {specs && (
                <div className="px-5 pb-5 space-y-2.5">
                  <h4 className={`text-[12px] font-bold uppercase tracking-widest ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                    ⚡ {lang === "RU" ? "Характеристики и гарантия" : "Xususiyatlar va kafolat"}
                  </h4>

                  <div className={`p-4 rounded-3xl border space-y-3 text-[12px] ${d ? "bg-white/[0.03] border-white/10" : "bg-white border-black/10 shadow-sm"}`}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0">🌐</span>
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">UZIMEI:</p>
                        <p className="font-semibold text-emerald-400">{specs.uzimei}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                      <Camera size={16} className="text-[#2997FF] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">{lang === "RU" ? "Камера" : "Kamera"}:</p>
                        <p className="font-medium leading-snug">{specs.camera}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                      <Cpu size={16} className="text-[#2997FF] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">{lang === "RU" ? "Процессор" : "Protsessor"}:</p>
                        <p className="font-medium leading-snug">{specs.processor}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                      <Layers size={16} className="text-[#2997FF] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">{lang === "RU" ? "Дисплей" : "Displey"}:</p>
                        <p className="font-medium leading-snug">{specs.display}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                      <Box size={16} className="text-[#2997FF] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">{lang === "RU" ? "В комплекте" : "Qutida"}:</p>
                        <p className="font-medium leading-snug">{specs.boxContents}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-50">{lang === "RU" ? "Гарантия" : "Kafolat"}:</p>
                        <p className="font-medium text-emerald-400 leading-snug">{specs.warranty}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ INSTALLMENT PLANS (РАССРОЧКА / MUDDATLI TO'LOV) ════════ */}
              {specs?.installment && (
                <div className="px-5 pb-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-[12px] font-bold uppercase tracking-widest ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      💳 {lang === "RU" ? "Доступно в рассрочку" : "Muddatli to'lovga mavjud"}
                    </h4>
                    <span className="text-[10px] font-semibold text-[#2997FF]">Без банка • По паспорту</span>
                  </div>

                  <div className={`p-4 rounded-3xl border space-y-2.5 ${d ? "bg-white/[0.03] border-white/10" : "bg-white border-black/10 shadow-sm"}`}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="opacity-60">{lang === "RU" ? "Первоначальный взнос (30%):" : "Boshlang'ich to'lov (30%):"}</span>
                      <span className="font-extrabold text-emerald-400">
                        {fmtPrice(specs.installment.initialPaymentUsd, currencyRate, currency)} ✅
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5"}`}>
                        <p className="text-[10px] font-bold opacity-50">6 {lang === "RU" ? "мес" : "oy"}</p>
                        <p className="text-[13px] font-black text-white mt-0.5">
                          ${specs.installment.months6Usd}
                        </p>
                        <span className="text-[9px] text-amber-400 font-bold">🔥 Выгодно</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5"}`}>
                        <p className="text-[10px] font-bold opacity-50">9 {lang === "RU" ? "мес" : "oy"}</p>
                        <p className="text-[13px] font-black text-white mt-0.5">
                          ${specs.installment.months9Usd}
                        </p>
                        <span className="text-[9px] text-emerald-400 font-bold">🤩 Хит</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl border ${d ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5"}`}>
                        <p className="text-[10px] font-bold opacity-50">12 {lang === "RU" ? "мес" : "oy"}</p>
                        <p className="text-[13px] font-black text-white mt-0.5">
                          ${specs.installment.months12Usd}
                        </p>
                        <span className="text-[9px] text-sky-400 font-bold">💵 Минимум</span>
                      </div>
                    </div>

                    <p className={`text-[10px] opacity-40 text-center pt-1`}>
                      📝 {lang === "RU" ? "Требуемые документы: паспорт (оригинал или копия)" : "Kerakli hujjatlar: pasport (asli yoki nusxasi)"}
                    </p>
                  </div>
                </div>
              )}

              {/* ════════ STORE MANAGERS CONTACT BAR ════════ */}
              <div className="px-5 pb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                    📞 {lang === "RU" ? "Контакты менеджеров филиала" : "Filial menejerlari kontaktlari"}
                  </span>
                  <a
                    href={STORE_TELEGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#2997FF] hover:underline flex items-center gap-1"
                  >
                    <MessageCircle size={12} />
                    <span>@Prostoreuzb</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STORE_MANAGERS.map((m) => (
                    <a
                      key={m.name}
                      href={`tel:${m.phone}`}
                      className={`py-2 px-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold transition-all ${
                        d ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/5 hover:bg-black/10 border-black/10 text-[#1C1C1E]"
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="font-mono text-[10px] text-emerald-400 shrink-0">{m.displayPhone}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* ════════ STICKY BOTTOM BAR (RESERVATION ACTION) ════════ */}
              <div
                className={`
                  sticky bottom-0 px-5 py-4
                  ${d ? "bg-[#0b0c11]/95 border-t border-white/[0.08]" : "bg-white/95 border-t border-black/[0.08]"}
                  backdrop-blur-[80px] backdrop-saturate-200 z-30
                `}
              >
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5 ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      {lang === "RU" ? "Стоимость к бронированию" : "Band qilish narxi"}
                    </p>
                    <motion.p
                      key={currentPrice}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[24px] font-black leading-none tracking-tight ${d ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]" : "text-[#1C1C1E]"}`}
                    >
                      {fmtPrice(currentPrice, currencyRate, currency)}
                    </motion.p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {lang === "RU" ? "Без предоплаты" : "Oldindan to'lovsiz"}
                  </span>
                </div>

                {/* Primary Booking Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={tapSpring}
                  disabled={isNew && !inStock || isBookingLoading}
                  onClick={handleBookClick}
                  className={`
                    w-full py-4 rounded-2xl text-[15px] font-bold
                    flex items-center justify-center gap-2
                    transition-all cursor-pointer
                    ${
                      isNew && !inStock
                        ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#0A84FF] via-[#0071E3] to-[#0058CA] text-white border border-white/20 shadow-[0_4px_20px_rgba(10,132,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-[0.98]"
                    }
                  `}
                >
                  <Bookmark size={18} />
                  <span>
                    {isBookingLoading
                      ? (lang === "RU" ? "Бронируем..." : "Band qilinmoqda...")
                      : (lang === "RU" ? "Забронировать на 24 часа" : "24 soatga band qilish")}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
