"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Smartphone,
  Layers,
  CheckCircle2,
  Trash2,
  Loader2,
  DollarSign,
  Cpu,
  Palette,
  Wifi,
  Package,
} from "lucide-react";

type AdminAddNewProductProps = {
  shopId: string;
};

type VariantDraft = {
  id: string;
  color: string;
  storage: string;
  simType: string;
  price: number;
  stock: number;
};

const STORAGE_OPTIONS = ["128GB", "256GB", "512GB", "1TB", "64GB", "2TB"];
const SIM_OPTIONS = ["eSIM", "Physical + eSIM", "Dual Nano-SIM"];
const COLOR_OPTIONS = [
  "Space Black",
  "Natural Titanium",
  "White Titanium",
  "Desert Titanium",
  "Deep Purple",
  "Silver",
  "Midnight",
  "Starlight",
];

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminAddNewProduct({ shopId }: AdminAddNewProductProps) {
  const router = useRouter();

  /* ── 1. Main Product State ── */
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  /* ── 2. Variant Builder Draft State ── */
  const [draftStorage, setDraftStorage] = useState("256GB");
  const [draftColor, setDraftColor] = useState("Natural Titanium");
  const [draftSimType, setDraftSimType] = useState("eSIM");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftStock, setDraftStock] = useState("10");

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ── 3. Add Variant Handler ── */
  function handleAddVariant() {
    const priceNum = Number(draftPrice || basePrice);
    if (!priceNum || isNaN(priceNum)) {
      alert("Укажите базовую цену товара или цену для этой вариации");
      return;
    }

    const newVariant: VariantDraft = {
      id: Math.random().toString(36).substring(2, 9),
      color: draftColor,
      storage: draftStorage,
      simType: draftSimType,
      price: priceNum,
      stock: Number(draftStock) || 10,
    };

    setVariants((prev) => [...prev, newVariant]);
  }

  /* ── 4. Remove Variant Handler ── */
  function handleRemoveVariant(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  /* ── 5. Form Submission ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !basePrice || isNaN(Number(basePrice))) {
      alert("Заполните название и базовую цену товара");
      return;
    }

    if (variants.length === 0) {
      alert("Добавьте хотя бы одну вариацию товара (нажмите кнопку + Добавить вариант)");
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    try {
      const res = await fetch("/api/admin/products/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId,
          title: title.trim(),
          basePrice: Number(basePrice),
          variants: variants.map((v) => ({
            color: v.color,
            storage: v.storage,
            simType: v.simType,
            price: Number(v.price),
            stock: Number(v.stock),
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset form
        setTitle("");
        setBasePrice("");
        setVariants([]);
        setDraftPrice("");
        setShowSuccess(true);
        router.refresh();

        setTimeout(() => {
          setShowSuccess(false);
        }, 4000);
      } else {
        alert(data.error || "Ошибка создания товара");
      }
    } catch (err: any) {
      console.error("Error submitting new product:", err);
      alert("Ошибка сети при отправке формы");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="w-10 h-10 rounded-glass-btn bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
          <Smartphone size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
            Новый товар и Матрица
          </h2>
          <p className="text-[11px] text-white/30">
            Создайте модель и привяжите модификации памяти и цветов
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-glass bg-[#34C759]/15 border border-[#34C759]/25 text-[#34C759] flex items-center gap-3 backdrop-blur-2xl"
          >
            <CheckCircle2 size={22} className="text-[#34C759] flex-shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-white">
                Матрица товара опубликована!
              </p>
              <p className="text-[11px] text-[#34C759]/80">
                Все вариации добавлены в каталог нового оборудования
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group 1: General Product Template Info */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone size={14} className="text-[#007AFF]" />
          Основная модель
        </p>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-white/60">
            Название линейки / модели *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="например, iPhone 16 Pro"
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.03] transition-all font-semibold"
          />
        </div>

        {/* Base Price */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-white/60 flex items-center justify-between">
            <span>Базовая цена ($ USD) *</span>
            <span className="text-[10px] text-white/30 font-normal">От неё можно отталкиваться</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="999"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.03] transition-all font-bold"
            />
          </div>
        </div>
      </div>

      {/* Group 2: Variant Builder */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-[#007AFF]" />
            Сборка вариаций
          </p>
          <span className="text-[10px] font-bold px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-white/40">
            Добавлено: {variants.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Storage */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 flex items-center gap-1">
              <Cpu size={12} /> Память
            </label>
            <select
              value={draftStorage}
              onChange={(e) => setDraftStorage(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 appearance-none font-medium"
            >
              {STORAGE_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-[#111113]">
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* SIM Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 flex items-center gap-1">
              <Wifi size={12} /> Тип SIM
            </label>
            <select
              value={draftSimType}
              onChange={(e) => setDraftSimType(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 appearance-none font-medium"
            >
              {SIM_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-[#111113]">
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Color (Full width) */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 flex items-center gap-1">
              <Palette size={12} /> Цвет
            </label>
            <select
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 appearance-none font-medium"
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-[#111113]">
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Variant Price */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 flex items-center gap-1">
              <DollarSign size={12} /> Цена ($)
            </label>
            <input
              type="number"
              placeholder={basePrice || "0"}
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 font-bold"
            />
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 flex items-center gap-1">
              <Package size={12} /> Сток (шт)
            </label>
            <input
              type="number"
              min="0"
              value={draftStock}
              onChange={(e) => setDraftStock(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 font-medium"
            />
          </div>
        </div>

        {/* Add variant button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={tapSpring}
          onClick={handleAddVariant}
          className="w-full mt-2 py-3 rounded-glass-btn bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/25 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#007AFF]/25 transition-colors"
        >
          <PlusCircle size={16} />
          Добавить в матрицу
        </motion.button>
      </div>

      {/* Group 3: Added Variants List */}
      <AnimatePresence>
        {variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2.5"
          >
            {variants.map((v) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={v.id}
                className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-white">
                    {v.storage} · {v.color}
                  </p>
                  <p className="text-[11px] text-white/50 flex items-center gap-2">
                    <span>{v.simType}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{v.stock} шт</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[14px] font-black text-[#007AFF]">${v.price}</p>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    transition={tapSpring}
                    onClick={() => handleRemoveVariant(v.id)}
                    className="w-8 h-8 rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/25 flex items-center justify-center text-[#FF3B30] hover:bg-[#FF3B30]/25 transition-colors"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Submit Button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          transition={tapSpring}
          disabled={isLoading || variants.length === 0}
          className={`
            w-full py-4 rounded-glass-btn text-[15px] font-bold transition-all
            ${
              isLoading || variants.length === 0
                ? "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
                : "btn-system-blue"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Публикация...
            </span>
          ) : (
            "Опубликовать товар и " + variants.length + " вариаций"
          )}
        </motion.button>
      </div>
    </form>
  );
}
