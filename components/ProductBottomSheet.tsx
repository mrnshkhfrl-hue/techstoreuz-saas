"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Battery,
  Box,
  AlertCircle,
  ShoppingCart,
  Check,
  Smartphone,
  Fingerprint,
  HardDrive,
} from "lucide-react";
import { useTelegramContext } from "@/components/TelegramProvider";
import { useCart } from "@/providers/CartProvider";
import { getModelPhoto, extractStorage } from "@/lib/product-images";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type ProductBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  isDark: boolean;
  lang: "RU" | "UZ";
  currency: "USD" | "UZS";
  currencyRate: number;
};

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

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

/* Phone SVG */
function PhoneSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="16" y="8" width="88" height="184" rx="20" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <rect x="24" y="30" width="72" height="136" rx="4" fill="currentColor" opacity="0.04" />
      <rect x="46" y="15" width="28" height="6" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="44" y="178" width="32" height="5" rx="2.5" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function ProductBottomSheet({
  isOpen,
  onClose,
  product,
  isDark,
  lang,
  currency,
  currencyRate,
}: ProductBottomSheetProps) {
  const d = isDark;
  const { haptic } = useTelegramContext();

  /* Detect product type: new (has variants) vs used */
  const isNew = product?.variants && product.variants.length > 0;

  /* ── State for configurator (new products) ── */
  const storageOptions = useMemo(() => {
    if (!isNew) return [];
    return [...new Set(product.variants.map((v: any) => v.storage))] as string[];
  }, [product, isNew]);

  const colorOptions = useMemo(() => {
    if (!isNew) return [];
    return [...new Set(product.variants.map((v: any) => v.color))] as string[];
  }, [product, isNew]);

  const simOptions = useMemo(() => {
    if (!isNew) return [];
    return [...new Set(product.variants.map((v: any) => v.simType))] as string[];
  }, [product, isNew]);

  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSim, setSelectedSim] = useState("");

  /* Cascading filtered options: color and sim depend on selected storage */
  const filteredColorOptions = useMemo(() => {
    if (!isNew || !selectedStorage) return colorOptions;
    const colors = [...new Set(
      product.variants
        .filter((v: any) => v.storage === selectedStorage)
        .map((v: any) => v.color)
    )] as string[];
    return colors.length > 0 ? colors : colorOptions;
  }, [product, isNew, selectedStorage, colorOptions]);

  const filteredSimOptions = useMemo(() => {
    if (!isNew || !selectedStorage || !selectedColor) return simOptions;
    const sims = [...new Set(
      product.variants
        .filter((v: any) => v.storage === selectedStorage && v.color === selectedColor)
        .map((v: any) => v.simType)
    )] as string[];
    return sims.length > 0 ? sims : simOptions;
  }, [product, isNew, selectedStorage, selectedColor, simOptions]);

  /* Reset selections when product changes */
  useEffect(() => {
    if (isNew && product) {
      setSelectedStorage(storageOptions[0] || "");
      setSelectedColor(colorOptions[0] || "");
      setSelectedSim(simOptions[0] || "");
    }
  }, [product?.id]);

  /* Auto-cascade: when storage changes, pick first compatible color */
  useEffect(() => {
    if (isNew && selectedStorage) {
      if (!filteredColorOptions.includes(selectedColor)) {
        setSelectedColor(filteredColorOptions[0] || "");
      }
    }
  }, [selectedStorage, filteredColorOptions]);

  /* Auto-cascade: when color changes, pick first compatible sim */
  useEffect(() => {
    if (isNew && selectedColor) {
      if (!filteredSimOptions.includes(selectedSim)) {
        setSelectedSim(filteredSimOptions[0] || "");
      }
    }
  }, [selectedColor, filteredSimOptions]);

  /* Find matching variant and derive price */
  const matchedVariant = useMemo(() => {
    if (!isNew) return null;
    return product.variants.find(
      (v: any) =>
        v.storage === selectedStorage &&
        v.color === selectedColor &&
        v.simType === selectedSim
    );
  }, [product, isNew, selectedStorage, selectedColor, selectedSim]);

  const currentPrice = isNew
    ? matchedVariant?.price ?? product.basePrice
    : product?.price ?? 0;

  const inStock = matchedVariant ? matchedVariant.stock > 0 : true;

  const { addItem } = useCart();

  function handleAddToCart() {
    haptic.impactOccurred('medium');
    if (isNew) {
      if (!inStock) return;
      addItem({
        id: matchedVariant?.id || product.id,
        type: "NEW",
        title: product.title,
        variant: [selectedStorage, selectedColor, selectedSim].filter(Boolean).join(" · "),
        price: currentPrice,
      });
    } else {
      addItem({
        id: product.id,
        type: "USED",
        title: product.title,
        variant: `Б/У · ${product.batteryHealth}% АКБ · ${product.region}`,
        price: currentPrice,
      });
    }
    onClose();
  }

  /* Battery color for used */
  const batteryColor = useMemo(() => {
    if (isNew || !product) return "";
    const bh = product.batteryHealth;
    if (bh >= 90) return d ? "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/15" : "text-[#34C759] bg-[#34C759]/8 border-[#34C759]/15";
    if (bh >= 80) return d ? "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/15" : "text-[#FF9500] bg-[#FF9500]/8 border-[#FF9500]/15";
    return d ? "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/15" : "text-[#FF3B30] bg-[#FF3B30]/8 border-[#FF3B30]/15";
  }, [product, isNew, d]);

  /* Chip styles */
  const chipBase = d
    ? "bg-white/[0.05] text-white/50 border border-white/[0.06]"
    : "bg-black/[0.04] text-[#1C1C1E]/50 border border-black/[0.04]";

  const chipActive = "bg-[#007AFF] text-white border border-[#007AFF] shadow-md shadow-[#007AFF]/20";

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
          />

          {/* ── Sheet — Liquid Glass ── */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 32,
            }}
            className={`
              fixed bottom-0 left-0 right-0
              mx-auto w-full max-w-[430px] z-[90]
              rounded-t-3xl overflow-hidden
              ${d ? "bg-[#0a0a0f]/95 border-white/10 text-white" : "bg-white/95 border-black/10 text-[#1C1C1E]"}
              backdrop-blur-2xl border-t border-x shadow-2xl
            `}
            style={{
              maxHeight: "92vh",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            <div className="overflow-y-auto max-h-[88vh] overscroll-contain">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sticky top-0 z-10">
                <div
                  className={`w-9 h-[5px] rounded-full ${
                    d ? "bg-white/15" : "bg-black/10"
                  }`}
                />
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <h3
                  className={`text-[17px] font-bold tracking-tight ${
                    d ? "text-white" : "text-[#1C1C1E]"
                  }`}
                >
                  {product.title}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  transition={tapSpring}
                  onClick={onClose}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    liquid-glass transition-colors
                  `}
                >
                  <X size={16} className={d ? "text-white/60" : "text-[#1C1C1E]/40"} />
                </motion.button>
              </div>

              {/* Phone illustration */}
              <div className="flex justify-center px-5 pb-4">
                <div
                  className={`
                    w-48 h-52 rounded-glass flex items-center justify-center overflow-hidden
                    ${d ? "bg-gradient-to-b from-white/[0.03] to-white/[0.01]" : "bg-gradient-to-b from-black/[0.02] to-transparent"}
                  `}
                >
                  <img
                    src={getModelPhoto(product?.title)}
                    alt={product?.title || "Device"}
                    className="w-full h-full object-contain p-2 drop-shadow-xl transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/products/iphone15pro_1.webp";
                    }}
                  />
                </div>
              </div>

              {/* ═══════ NEW PRODUCT CONFIGURATOR ═══════ */}
              {isNew && (
                <div className="px-5 pb-6 space-y-5">
                  {/* Storage selector */}
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-2.5 ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                      {lang === "RU" ? "Память" : "Xotira"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((s) => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.94 }}
                          transition={tapSpring}
                          onClick={() => {
                            setSelectedStorage(s);
                            haptic.selectionChanged();
                          }}
                          className={`
                            px-4 py-2.5 rounded-glass-btn text-[13px] font-semibold
                            transition-all duration-200
                            ${selectedStorage === s ? chipActive : chipBase}
                          `}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Color selector */}
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-2.5 ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                      {lang === "RU" ? "Цвет" : "Rang"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {filteredColorOptions.map((c) => (
                        <motion.button
                          key={c}
                          whileTap={{ scale: 0.94 }}
                          transition={tapSpring}
                          onClick={() => {
                            setSelectedColor(c);
                            haptic.selectionChanged();
                          }}
                          className={`
                            px-4 py-2.5 rounded-glass-btn text-[13px] font-semibold
                            transition-all duration-200 flex items-center gap-1.5
                            ${selectedColor === c ? chipActive : chipBase}
                          `}
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
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-2.5 ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                        {lang === "RU" ? "Тип SIM" : "SIM turi"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {filteredSimOptions.map((s) => (
                          <motion.button
                            key={s}
                            whileTap={{ scale: 0.94 }}
                            transition={tapSpring}
                            onClick={() => {
                              setSelectedSim(s);
                              haptic.selectionChanged();
                            }}
                            className={`
                              px-4 py-2.5 rounded-glass-btn text-[13px] font-semibold
                              transition-all duration-200 flex items-center gap-1.5
                              ${selectedSim === s ? chipActive : chipBase}
                            `}
                          >
                            <Fingerprint size={13} />
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock indicator */}
                  {matchedVariant && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-glass-btn
                        liquid-glass
                      `}
                    >
                      <Smartphone size={14} className={d ? "text-white/30" : "text-[#1C1C1E]/30"} />
                      <p className={`text-[12px] font-medium ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                        {lang === "RU"
                          ? `В наличии: ${matchedVariant.stock} шт.`
                          : `Mavjud: ${matchedVariant.stock} dona`}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ═══════ USED PRODUCT DETAILS ═══════ */}
              {!isNew && (
                <div className="px-5 pb-6 space-y-4">
                  {/* Unique badge */}
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-glass-btn
                      ${d ? "bg-[#007AFF]/8 border border-[#007AFF]/12" : "bg-[#007AFF]/6 border border-[#007AFF]/12"}
                    `}
                  >
                    <Smartphone size={14} className="text-[#007AFF]" />
                    <p className={`text-[12px] font-semibold text-[#007AFF]`}>
                      {lang === "RU"
                        ? "Этот товар в единственном экземпляре"
                        : "Bu tovar yagona nusxada"}
                    </p>
                  </div>

                  {/* Specs grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Storage / Memory */}
                    <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-glass-btn liquid-glass`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-glass-xs ${chipBase}`}>
                        <HardDrive size={14} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                          {lang === "RU" ? "Память" : "Xotira"}
                        </p>
                        <p className={`text-[14px] font-bold ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                          {extractStorage(product.title)}
                        </p>
                      </div>
                    </div>

                    {/* Battery */}
                    <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-glass-btn liquid-glass`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-glass-xs border ${batteryColor}`}>
                        <Battery size={14} />
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                          {lang === "RU" ? "Аккумулятор" : "Batareya"}
                        </p>
                        <p className={`text-[14px] font-bold ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                          {product.batteryHealth}%
                        </p>
                      </div>
                    </div>

                    {/* Region */}
                    <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-glass-btn liquid-glass`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-glass-xs ${chipBase}`}>
                        <span className="text-[13px]">🌐</span>
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                          {lang === "RU" ? "Регион" : "Hudud"}
                        </p>
                        <p className={`text-[14px] font-bold ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                          {product.region}
                        </p>
                      </div>
                    </div>

                    {/* Box */}
                    <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-glass-btn liquid-glass`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-glass-xs ${chipBase}`}>
                        <Box size={14} />
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                          {lang === "RU" ? "Коробка" : "Quti"}
                        </p>
                        <p className={`text-[14px] font-bold ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                          {product.hasBox ? (lang === "RU" ? "Есть" : "Bor") : (lang === "RU" ? "Нет" : "Yo'q")}
                        </p>
                      </div>
                    </div>

                    {/* Defects */}
                    <div className={`col-span-2 flex items-center gap-2.5 px-4 py-3 rounded-glass-btn liquid-glass`}>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-glass-xs shrink-0 ${
                          product.defects
                            ? d
                              ? "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/15"
                              : "bg-[#FF9500]/8 text-[#FF9500] border border-[#FF9500]/15"
                            : chipBase
                        }`}
                      >
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                          {lang === "RU" ? "Дефекты и состояние" : "Nuqsonlar va holat"}
                        </p>
                        <p className={`text-[12px] font-bold leading-tight ${d ? "text-white/90" : "text-[#1C1C1E]"}`}>
                          {product.defects || (lang === "RU" ? "Идеальное состояние, без дефектов" : "Mukammal holatda, nuqsonsiz")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ BOTTOM ACTION BAR ═══════ */}
              <div
                className={`
                  sticky bottom-0 px-5 py-4
                  ${d ? "bg-[#0a0a0f]/95 border-t border-white/[0.08]" : "bg-white/95 border-t border-black/[0.08]"}
                  backdrop-blur-[80px] backdrop-saturate-200
                `}
              >
                {/* Price display */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5 ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                      {isNew
                        ? matchedVariant
                          ? lang === "RU" ? "Цена конфигурации" : "Konfiguratsiya narxi"
                          : lang === "RU" ? "Базовая цена" : "Asosiy narx"
                        : lang === "RU" ? "Итого" : "Jami"}
                    </p>
                    <motion.p
                      key={currentPrice}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[26px] font-bold leading-none tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}
                    >
                      {fmtPrice(currentPrice, currencyRate, currency)}
                    </motion.p>
                  </div>
                  {isNew && matchedVariant && (
                    <p className={`text-[11px] font-medium ${d ? "text-white/25" : "text-[#1C1C1E]/25"}`}>
                      {inStock
                        ? `${matchedVariant.stock} ${lang === "RU" ? "шт." : "dona"}`
                        : lang === "RU" ? "Нет в наличии" : "Mavjud emas"}
                    </p>
                  )}
                </div>

                {/* CTA button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={tapSpring}
                  disabled={isNew && !inStock}
                  onClick={handleAddToCart}
                  className={`
                    w-full py-4 rounded-2xl text-[15px] font-bold
                    flex items-center justify-center gap-2
                    transition-all
                    ${
                      isNew && !inStock
                        ? d
                          ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                          : "bg-black/5 text-[#1C1C1E]/20 border border-black/5 cursor-not-allowed"
                        : "bg-[#007AFF] hover:bg-[#0A84FF] text-white shadow-[0_4px_20px_rgba(0,122,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                    }
                  `}
                >
                  <ShoppingCart size={18} />
                  {isNew && !inStock
                    ? lang === "RU" ? "Нет в наличии" : "Mavjud emas"
                    : lang === "RU" ? "Забронировать" : "Band qilish"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
