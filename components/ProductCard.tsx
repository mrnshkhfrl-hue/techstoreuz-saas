"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { getColorHex, shouldHidePhoneFields } from "@/lib/config";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: any;
  onClick: () => void;
  currentLang: string;
}

export function ProductCard({ product, onClick, currentLang }: ProductCardProps) {
  const isNewArrival = useMemo(() => {
    if (!product.createdAt) return false;
    const createdAt = new Date(product.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;
    return Date.now() - createdAt < 24 * 60 * 60 * 1000;
  }, [product.createdAt]);

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cpath d='M160 100h80c11 0 20 9 20 20v160c0 11-9 20-20 20h-80c-11 0-20-9-20-20V120c0-11 9-20 20-20zm40 160a10 10 0 100-20 10 10 0 000 20z' fill='%23d1d5db'/%3E%3C/svg%3E";

  const images = useMemo(() => {
    try {
      const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [FALLBACK_IMAGE];
    } catch(e) { return [FALLBACK_IMAGE]; }
  }, [product.images]);

  const variants = product.variants || [];
  
  const colorsList = useMemo(() => {
    const colors = new Set<string>();
    variants.forEach((v: any) => {
      const attrs = v.attributes || {};
      const colorKey = Object.keys(attrs).find(k => k.toLowerCase() === 'color' || k.toLowerCase() === 'цвет' || k.toLowerCase() === 'rang');
      if (colorKey && attrs[colorKey]) colors.add(attrs[colorKey]);
    });
    return Array.from(colors);
  }, [variants]);

  const isUsed = product.isUsed ?? product.deviceCondition === "Used";
  const isNew = !isUsed;

  const storageList = useMemo(() => {
    if (isUsed && product.storage) return [product.storage];
    
    const storages = new Set<string>();
    variants.forEach((v: any) => {
      const attrs = v.attributes || {};
      const storageKey = Object.keys(attrs).find(k => k.toLowerCase() === 'memory' || k.toLowerCase() === 'память' || k.toLowerCase() === 'xotira' || k.toLowerCase() === 'storage');
      if (storageKey && attrs[storageKey]) storages.add(attrs[storageKey]);
    });
    return Array.from(storages).sort((a, b) => parseInt(a) - parseInt(b));
  }, [variants, isUsed, product.storage]);

  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);


  const { currency, exchangeRate } = useCurrency();
  
  const displayName = currentLang === "uz" && product.nameUz ? product.nameUz : product.name;

  const minPrice = variants.length > 0 ? Math.min(...variants.map((v: any) => Number(v.price) || 0)) : Number(product.price);
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v: any) => Number(v.price) || 0)) : Number(product.price);
  const hasDifferentPrices = minPrice !== maxPrice;
  let totalStock = variants.length > 0 ? variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) : (Number(product.stockCount) || 0);
  if (isUsed && product?.isAvailable !== false) totalStock = Math.max(totalStock, 1);

  // For NEW phones, cycle through images per color selection
  // For USED phones, show actual uploaded photos gallery
  const currentImage = isNew && colorsList.length > 1 && images.length > 1
    ? images[selectedColorIdx % images.length]
    : images[imageIndex];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white dark:bg-white/[0.04] dark:backdrop-blur-2xl rounded-[28px] cursor-pointer transition-all flex flex-col border border-gray-100 dark:border-white/[0.08] shadow-sm group overflow-hidden ${totalStock === 0 ? 'opacity-60 grayscale-[30%] hover:opacity-80' : 'active:scale-[0.98] hover:shadow-2xl hover:shadow-black/10'}`}
    >
      {/* Condition Badge */}
      <div className="relative">
        <div className="aspect-square bg-gray-50 dark:bg-black/60 overflow-hidden flex items-center justify-center relative">
          <AnimatePresence mode="wait">
             <motion.img 
               key={isUsed ? imageIndex : selectedColorIdx}
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               src={currentImage || FALLBACK_IMAGE} 
               alt={displayName} 
               className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
               onError={(e) => { 
                 if (e.currentTarget.src !== FALLBACK_IMAGE) {
                   e.currentTarget.src = FALLBACK_IMAGE; 
                 }
               }}
             />
          </AnimatePresence>

          {/* Used: Photo Gallery Navigation */}
          {isUsed && images.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={prevImage} className="w-7 h-7 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xl flex items-center justify-center text-black dark:text-white shadow-lg active:scale-90 transition-all">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={nextImage} className="w-7 h-7 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xl flex items-center justify-center text-black dark:text-white shadow-lg active:scale-90 transition-all">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}

          {/* Image counter for Used */}
          {isUsed && images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {imageIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Condition tag — iOS system pill */}
        {(() => {
          if (isUsed) {
            return (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg bg-amber-500/90 text-white">
                Б/У
              </div>
            );
          }
          if (isNewArrival) {
            return (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg bg-emerald-500/90 text-white">
                Новый
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col p-4">
        {/* Title */}
        <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white leading-tight mb-2 line-clamp-1 tracking-tight">
          {displayName}
        </h3>
        
        {/* Telegram-post style specs */}
        <div className="space-y-1 mb-3 text-[12px] leading-relaxed">
          {/* Memory */}
          {storageList.length > 0 && (
            <p className="text-gray-600 dark:text-gray-400">
              🧠 {storageList.join(" / ")}
            </p>
          )}

          {/* Region — New and Used */}
          {product.region && (
            <p className="text-gray-600 dark:text-gray-400">
              🌏 Region {product.region}
            </p>
          )}

          {/* SIM */}
          {product.sim && (
            <p className="text-gray-600 dark:text-gray-400">
              💳 SIM: {product.sim}
            </p>
          )}

          {/* Battery & Phone-specific specs (Hide for audio/accessories) */}
          {!shouldHidePhoneFields(product.category || '') && (
            <>
              {/* Battery — Used only */}
              {isUsed && product.batteryHealth && (
                <p className="text-gray-600 dark:text-gray-400">
                  🔋 {product.batteryHealth}%
                </p>
              )}

              {/* Cycles — Used only */}
              {isUsed && product.batteryCycles && (
                <p className="text-gray-600 dark:text-gray-400">
                  🔌 {product.batteryCycles}-tsikl
                </p>
              )}

              {/* UzIMEI */}
              <p className="text-gray-600 dark:text-gray-400">
                UzIMEI {product.uzImei ? "✅" : "❌"}
              </p>

              {/* Box */}
              <p className="text-gray-600 dark:text-gray-400">
                {product.box ? "📦 bor" : "📦 yo'q"}
              </p>
            </>
          )}

          {/* New: Warranty */}
          {isNew && (
            <p className="text-gray-600 dark:text-gray-400">📝 Garantiya bor</p>
          )}

          {/* Defects — Used only */}
          {isUsed && product.defects && (
            <p className="text-gray-600 dark:text-gray-400 line-clamp-1">
              🛠️ {product.defects}
            </p>
          )}
        </div>

        {/* Price and Stock */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/5">
          {totalStock === 0 ? (
            <div className="py-2 text-center bg-gray-100 dark:bg-white/5 rounded-xl">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {currentLang === "uz" ? "Sotuvda yo'q" : "Нет в наличии"}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                  {hasDifferentPrices && <span className="text-[12px] text-gray-400 mr-1 font-semibold">{currentLang === "uz" ? "dan" : "от"}</span>}
                  {formatPrice(minPrice, currency, exchangeRate)}
                </span>
                {product.oldPrice && product.oldPrice > minPrice && (
                  <span className="text-[12px] font-bold text-gray-400 line-through decoration-gray-300 dark:decoration-gray-600 decoration-[1.5px]">
                    {formatPrice(product.oldPrice, currency, exchangeRate)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Installment mini-block for New */}
        {isNew && product.installmentAvailable && (product.installment6m || product.installment9m || product.installment12m) && (
          <div className="mt-3 pt-3 border-t border-emerald-500/10 space-y-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-70">Muddatli to&apos;lov:</p>
            {product.installmentDownPayment && (
              <p>📃 {formatPrice(product.installmentDownPayment, currency, exchangeRate)} boshlang&apos;ich ✅</p>
            )}
            {product.installment6m && (
              <p>6 oy — {formatPrice(product.installment6m, currency, exchangeRate)} /oy</p>
            )}
            {product.installment9m && (
              <p>9 oy — {formatPrice(product.installment9m, currency, exchangeRate)} /oy</p>
            )}
            {product.installment12m && (
              <p>12 oy — {formatPrice(product.installment12m, currency, exchangeRate)} /oy</p>
            )}
          </div>
        )}

        {/* Color swatches — glassmorphic, max 4 visible */}
        {colorsList.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {colorsList.slice(0, 4).map((c: any, idx: number) => {
              const colorName = typeof c === 'string' ? c : c.name;
              const hex = (typeof c === 'object' && c.hex) ? c.hex : getColorHex(colorName);
              return (
                <button
                  key={colorName}
                  title={colorName}
                  onClick={(e) => { e.stopPropagation(); setSelectedColorIdx(idx); }}
                  className={`w-5 h-5 rounded-full border transition-all backdrop-blur-sm ${selectedColorIdx === idx ? "border-[#007AFF] scale-110 shadow-md ring-2 ring-[#007AFF]/30" : "border-white/30 dark:border-white/10 opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
            {colorsList.length > 4 && (
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 ml-0.5">+{colorsList.length - 4}</span>
            )}
          </div>
        )}

        {/* Location / branch */}
        {product.location && (
          <div className="mt-2 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-400 dark:text-gray-500 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">{product.location}</span>
          </div>
        )}

        {/* Contact — validated phone */}
        {process.env.NEXT_PUBLIC_CONTACT_PHONE && (
          <a href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`} className="text-[10px] text-[#007AFF] mt-2 font-bold flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            {process.env.NEXT_PUBLIC_CONTACT_PHONE}
          </a>
        )}
      </div>
    </motion.div>
  );
}
