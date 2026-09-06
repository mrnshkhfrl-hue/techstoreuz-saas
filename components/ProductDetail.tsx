import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Toast from "./Toast";
import ImageViewer from "./ImageViewer";
import { getColorHex, shouldHidePhoneFields } from "@/lib/config";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  nameUz?: string;
  price: number;
  oldPrice?: number;
  images: string;
  description: string;
  descriptionUz?: string;
  category: string;
  attributes: string;
  colors: { name: string; hex: string }[];
  storage: string[];
  models: string;
  stockCount: number;
  isAvailable: boolean;
  isUsed?: boolean;
  videoUrl?: string;
  battery?: number;
  deviceCondition?: string;
  region?: string;
  uzImei?: boolean;
  box?: boolean;
  installmentAvailable?: boolean;
  installmentDownPayment?: number;
  installment6m?: number;
  installment9m?: number;
  installment12m?: number;
  batteryHealth?: number;
  batteryCycles?: number;
  defects?: string;
  variants?: any[];
};

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant: any, finalPrice: number, battery?: number, region?: string) => void;
  lang: any;
  currentLang: string;
  protectAction?: (action: () => void) => void;
  userPhone?: string;
  onReservationCreated?: () => void;
}

const CloseIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
);

export default function ProductDetail({ product, onClose, onAddToCart, lang, currentLang, protectAction, userPhone, onReservationCreated }: ProductDetailProps) {
  const { currency, exchangeRate } = useCurrency();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingPhone, setBookingPhone] = useState("+998");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "warning"; visible: boolean }>({ message: "", type: "error", visible: false });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [installmentMonths, setInstallmentMonths] = useState<6 | 9 | 12>(6);
  const [installmentSettings, setInstallmentSettings] = useState<any>({ installmentMarkup3: 10, installmentMarkup6: 20, installmentMarkup12: 30 });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d && !d.error) setInstallmentSettings(d);
    }).catch(() => {});
  }, []);

  // Reset state when product changes (prevents stale toast/booking)
  useEffect(() => {
    setToast({ message: "", type: "error", visible: false });
    setShowBookingModal(false);
    setIsBooking(false);
  }, [product?.id]);

  const showToast = useCallback((message: string, type: "error" | "success" | "warning" = "error") => {
    setToast({ message, type, visible: true });
  }, []);

  const isBookingPhoneValid = useMemo(() => {
    const clean = bookingPhone.replace(/\D/g, "");
    return clean.length === 12 && clean.startsWith("998");
  }, [bookingPhone]);

  const handleBookingPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");
    if (!input.startsWith("998")) input = "998" + input;
    input = input.slice(0, 12);
    setBookingPhone("+" + input);
  };

  const images = useMemo(() => {
    try {
      const parsed = typeof product?.images === "string" ? JSON.parse(product.images) : product?.images;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }, [product]);

  const displayImages = useMemo(() => {
    let imgs = [...images];
    return imgs.length > 0 ? imgs : ["https://placehold.co/600x600/f5f5f7/86868b?text=No+Image"];
  }, [images]);

  const variants = useMemo(() => product?.variants || [], [product]);

  const attributesData = useMemo(() => {
    const data: Record<string, string[]> = {};
    for (const v of variants) {
      if (v.attributes !== null && typeof v.attributes === "object" && !Array.isArray(v.attributes)) {
        for (const [key, val] of Object.entries(v.attributes)) {
          if (!data[key]) data[key] = [];
          if (!data[key].includes(String(val))) {
            data[key].push(String(val));
          }
        }
      }
    }
    return data;
  }, [variants]);

  useEffect(() => {
    if (product && variants.length > 0) {
      const firstAvailable = variants.find((v: any) => v.stock > 0) || variants[0];
      if (firstAvailable && firstAvailable.attributes !== null && typeof firstAvailable.attributes === "object" && !Array.isArray(firstAvailable.attributes)) {
        setSelectedAttributes(firstAvailable.attributes);
      }
    }
  }, [product, variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((v: any) => {
      if (!v.attributes || v.attributes === null || Array.isArray(v.attributes)) return false;
      return Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val);
    }) || null;
  }, [variants, selectedAttributes]);

  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);

  if (!product) return null;

  const isUsed = product.isUsed ?? product.deviceCondition === "Used";
  const displayName = currentLang === "uz" && product.nameUz ? product.nameUz : product.name;
  const displayDesc = currentLang === "uz" && product.descriptionUz ? product.descriptionUz : product.description;

  let currentStock = selectedVariant ? selectedVariant.stock : (product.stockCount || 0);
  if (isUsed && product.isAvailable !== false) currentStock = Math.max(currentStock, 1);

  return (
    <AnimatePresence mode="wait">
      {product && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[500px] max-h-[94vh] overflow-y-auto rounded-t-[32px] shadow-2xl bg-white dark:bg-[#0F172A] border-t border-gray-200 dark:border-white/5"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="sticky top-0 pt-4 pb-2 flex justify-center z-20 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md">
              <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
              <button onClick={onClose} className="absolute right-6 top-4 w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-all"><CloseIcon /></button>
            </div>

            <div className="px-6 pb-12">
              {/* Product Gallery */}
              <div className="mb-6 flex justify-center items-center aspect-square bg-gray-50 dark:bg-black/20 rounded-[28px] overflow-hidden relative">
                <style>{`
                  .product-swiper .swiper-button-next,
                  .product-swiper .swiper-button-prev {
                    color: white;
                    background: rgba(0,0,0,0.3);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    backdrop-filter: blur(8px);
                  }
                  .product-swiper .swiper-button-next:after,
                  .product-swiper .swiper-button-prev:after {
                    font-size: 12px;
                    font-weight: bold;
                  }
                  .product-swiper .swiper-pagination-bullet {
                    background: rgba(150,150,150,0.4);
                  }
                  .product-swiper .swiper-pagination-bullet-active {
                    background: #007AFF;
                  }
                `}</style>
                <Swiper modules={[Pagination, Navigation]} pagination={{ clickable: true }} navigation className="w-full h-full product-swiper">
                  {displayImages.map((img: string, idx: number) => (
                    <SwiperSlide key={`${img}-${idx}`} className="flex items-center justify-center w-full h-full" onClick={() => { setPreviewImages(displayImages); setPreviewIndex(idx); }}>
                      <img 
                        src={img} 
                        className="w-full h-full object-cover object-center cursor-pointer transition-opacity duration-300 animate-in fade-in" 
                        alt="" 
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Telegram-post style specs */}
              <div className="mb-8 p-6 rounded-[28px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2 text-[14px] leading-relaxed">
                {/* Condition badge — iOS style */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[12px] font-semibold tracking-tight ${isUsed ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {isUsed ? (currentLang === "ru" ? "Б/У" : "Ishlatilgan") : (currentLang === "ru" ? "Новый" : "Yangi")}
                  </span>
                  
                  {/* Location / branch */}
                  {(product as any).location && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-tight bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Наличие: {(product as any).location}
                    </span>
                  )}
                </div>

                {/* Dynamic Attributes Preview */}
                <div className="flex flex-wrap gap-2 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {Object.values(selectedAttributes).join(" / ")}
                </div>

                {/* Region — New and Used */}
                {product.region && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">🌏 Region {product.region}</p>
                )}

                {/* Storage — Used only (since New uses variants) */}
                {isUsed && product.storage && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">🧠 {product.storage}</p>
                )}

                {/* SIM */}
                {(product as any).sim && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">💳 SIM: {(product as any).sim}</p>
                )}

                {/* Battery & Phone-specific specs (Hide for audio/accessories/watch/dyson) */}
                {!shouldHidePhoneFields(product.category || '') && (
                  <>
                    {/* Battery Health — Used only */}
                    {isUsed && product.batteryHealth && (
                      <p className="font-semibold text-gray-700 dark:text-gray-300">🔋 {product.batteryHealth}%</p>
                    )}

                    {/* Battery Cycles — Used only */}
                    {isUsed && product.batteryCycles && (
                      <p className="font-semibold text-gray-700 dark:text-gray-300">🔌 {product.batteryCycles}-tsikl</p>
                    )}

                    {/* UzIMEI */}
                    <p className="font-semibold text-gray-700 dark:text-gray-300">UzIMEI {product.uzImei ? '✅' : '❌'}</p>
                  </>
                )}
                {/* Box */}
                {(!shouldHidePhoneFields(product.category || '') || product.box !== undefined) && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{product.box ? '📦 bor' : '📦 yo\'q'}</p>
                )}

                {/* Warranty — New only */}
                {!isUsed && (
                  <p className="font-semibold text-gray-700 dark:text-gray-300">📝 Garantiya bor</p>
                )}

                {/* Price */}
                <p className="font-black text-gray-900 dark:text-white text-[16px] pt-2">{formatPrice(currentPrice, currency, exchangeRate)}</p>

                {/* Defects — Used only */}
                {isUsed && product.defects && (
                  <div className="pt-2 mt-2 border-t border-amber-500/10">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">🛠️ holati: {product.defects}</p>
                  </div>
                )}

                {/* Contact */}
                {process.env.NEXT_PUBLIC_CONTACT_PHONE && (
                  <a href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 pt-1 hover:text-[#007AFF] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span className="font-bold tracking-wider">{process.env.NEXT_PUBLIC_CONTACT_PHONE}</span>
                  </a>
                )}
              </div>

              {/* Installment Section (Premium Style) */}
              {product.installmentAvailable && (
                <div className="mb-8 p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight">{currentLang === 'ru' ? 'Рассрочка' : "Muddatli to'lov"}</p>
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-tighter">0-0-{installmentMonths}</span>
                  </div>
                  
                  {product.installmentDownPayment && (
                    <div className="flex justify-between items-center mb-6 px-4 py-3 bg-white dark:bg-white/5 rounded-2xl">
                      <span className="text-[12px] font-bold text-gray-500">{currentLang === 'ru' ? 'Первый взнос:' : "Boshlang'ich to'lov:"}</span>
                      <span className="text-[16px] font-black text-gray-900 dark:text-white">{formatPrice(product.installmentDownPayment, currency, exchangeRate)}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mb-6">
                    {([6, 9, 12] as const).map(m => {
                      const hasValue = m === 6 ? product.installment6m : m === 9 ? product.installment9m : product.installment12m;
                      if (!hasValue) return null;
                      return (
                        <button 
                          key={m} 
                          type="button" 
                          onClick={() => setInstallmentMonths(m as any)} 
                          className={`flex-1 py-3 rounded-2xl text-[12px] font-black transition-all border ${installmentMonths === m ? "bg-emerald-500 text-white border-transparent" : "bg-white dark:bg-white/5 border-emerald-500/10 text-emerald-600"}`}
                        >
                          {m} {currentLang === 'ru' ? 'мес' : 'oy'}
                        </button>
                      );
                    })}
                  </div>

                  {(() => {
                    const exactMonthly = installmentMonths === 6 ? product.installment6m : installmentMonths === 9 ? product.installment9m : product.installment12m;
                    if (!exactMonthly) return null;
                    return (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-[28px] font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatPrice(exactMonthly, currency, exchangeRate)}</span>
                        <span className="text-[12px] font-bold text-emerald-600/40">/{currentLang === 'ru' ? 'мес' : "oy"}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">{displayName}</h2>
                <div className="flex flex-col">
                   <p className="text-[32px] font-black text-gray-900 dark:text-white tracking-tighter leading-none">{formatPrice(currentPrice, currency, exchangeRate)}</p>
                </div>
                <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{displayDesc}</p>
              </div>

              <div className="space-y-8 mb-10">
                {Object.entries(attributesData).map(([key, values]) => {
                  const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'цвет' || key.toLowerCase() === 'rang';
                  return (
                    <div key={key} className="space-y-4">
                      <p className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 tracking-tight">{key}: <span className="text-gray-900 dark:text-white">{selectedAttributes[key]}</span></p>
                      
                      {isColor ? (
                        <div className="flex flex-wrap gap-3">
                          {values.map((val) => {
                            const hex = getColorHex(val);
                            const isSelected = selectedAttributes[key] === val;
                            return (
                              <button 
                                key={val} 
                                onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: val }))} 
                                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isSelected ? "scale-110" : "opacity-60 hover:opacity-100"}`}
                              >
                                <div className={`w-12 h-12 rounded-full border-[3px] p-0.5 transition-all duration-300 ${isSelected ? "border-[#007AFF] shadow-lg shadow-blue-500/20" : "border-transparent"}`}>
                                  <div className="w-full h-full rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: hex }} />
                                </div>
                                <span className={`text-[9px] font-bold leading-tight text-center max-w-[56px] transition-colors duration-300 ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {values.map((val) => {
                            const isSelected = selectedAttributes[key] === val;
                            return (
                              <button 
                                key={val} 
                                onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: val }))} 
                                className={`px-6 py-4 rounded-2xl font-black text-[14px] transition-all border ${isSelected ? "bg-[#007AFF] text-white border-transparent" : "bg-gray-100 dark:bg-white/5 border-transparent text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3.5">
                <button 
                  disabled={currentStock === 0}
                  onClick={() => {
                    if (currentStock > 0) {
                      onAddToCart(product, selectedVariant, currentPrice, product.battery, product.region);
                    }
                  }}
                  className={`w-full py-4 rounded-[24px] font-semibold text-[17px] tracking-tight transition-all ${currentStock === 0 ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed" : "bg-[#007AFF] text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]"}`}
                >
                  {currentStock === 0 ? (currentLang === "ru" ? "Нет в наличии" : "Mavjud emas") : (currentLang === "ru" ? "В корзину" : "Savatga")}
                </button>
                
                {isUsed && (
                  <button 
                    onClick={() => {
                      if (protectAction) protectAction(() => setShowBookingModal(true));
                      else setShowBookingModal(true);
                    }} 
                    className="w-full py-4 liquid-btn text-gray-900 dark:text-white font-semibold text-[17px] tracking-tight"
                  >
                    {currentLang === "ru" ? "Забронировать" : "Band qilish"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {isUsed && (
            <AnimatePresence>
              {showBookingModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBookingModal(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] p-8 shadow-2xl rounded-[32px] text-center border border-gray-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
                      {currentLang === "ru" ? "Подтверждение" : "Tasdiqlash"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                      {currentLang === "ru" 
                        ? `Вы уверены, что хотите забронировать ` 
                        : `Siz ushbu mahsulotni band qilishga ishonchingiz komilmi: `}
                      <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>
                      {currentLang === "ru" ? " на номер " : " raqamiga: "}
                      <span className="font-bold text-[#007AFF]">{userPhone || bookingPhone}</span>?
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        disabled={isBooking}
                        onClick={async () => {
                          if (isBooking) return;
                          setIsBooking(true);
                          const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
                          const platform = (window as any).Telegram?.WebApp?.platform || "unknown";
                          try {
                            const res = await fetch("/api/order", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                telegramId: tgUser?.id,
                                username: tgUser?.username,
                                fullName: tgUser ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : "Покупатель",
                                phone: userPhone || bookingPhone,
                                type: "RESERVATION",
                                platform,
                                items: [{ productId: product.id, quantity: 1, variantId: selectedVariant?.id, battery: product.battery, region: product.region }],
                                total: currentPrice,
                                installmentMonths: product.installmentAvailable ? installmentMonths : null
                              })
                            });
                            if (res.ok) {
                              showToast(currentLang === "ru" ? "Успешно забронировано!" : "Muvaffaqiyatli band qilindi!", "success");
                              onReservationCreated?.();
                              setTimeout(() => { setShowBookingModal(false); onClose(); }, 1500);
                            } else {
                              const err = await res.json().catch(() => null);
                              showToast(err?.error || (currentLang === "ru" ? "Не удалось забронировать" : "Band qilib bo'lmadi"), "error");
                              setIsBooking(false);
                            }
                          } catch (err) {
                            showToast(currentLang === "ru" ? "Ошибка при бронировании" : "Band qilishda xatolik", "error");
                            setIsBooking(false);
                          }
                        }}
                        className="w-full py-4 bg-[#007AFF] text-white font-semibold text-[15px] rounded-[24px] tracking-tight shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                      >
                        {isBooking ? "..." : (currentLang === "ru" ? "Да, забронировать" : "Ha, band qilish")}
                      </button>
                      <button 
                        disabled={isBooking}
                        onClick={() => setShowBookingModal(false)}
                        className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-[15px] rounded-[24px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                      >
                        {currentLang === "ru" ? "Отмена" : "Bekor qilish"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      )}
      <ImageViewer images={previewImages} initialIndex={previewIndex} onClose={() => setPreviewImages([])} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
    </AnimatePresence>
  );
}
