"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  PlusCircle,
  BatteryCharging,
  Globe,
  Package,
  FileText,
  DollarSign,
  CheckCircle2,
  Loader2,
  Smartphone,
  Camera,
  X,
  Image as ImageIcon,
} from "lucide-react";

type AdminAddUsedProductProps = {
  shopId: string;
};

const REGION_OPTIONS = [
  { value: "LL/A", label: "LL/A (США)" },
  { value: "CH/A", label: "CH/A (Китай - 2 SIM)" },
  { value: "ZP/A", label: "ZP/A (Гонконг)" },
  { value: "RU/A", label: "RU/A (Россия)" },
  { value: "AH/A", label: "AH/A (ОАЭ)" },
  { value: "EU/A", label: "EU/A (Европа)" },
];

const MAX_IMAGES = 6;
const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminAddUsedProduct({ shopId }: AdminAddUsedProductProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [batteryHealth, setBatteryHealth] = useState<number>(90);
  const [region, setRegion] = useState("LL/A");
  const [hasBox, setHasBox] = useState(true);
  const [defects, setDefects] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection & compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      alert(`Максимум ${MAX_IMAGES} фото`);
      return;
    }

    const toProcess = files.slice(0, remaining);
    setIsUploading(true);

    try {
      const compressedFiles: File[] = [];
      const previews: string[] = [];

      for (const file of toProcess) {
        // Compress image
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        });

        compressedFiles.push(compressed);
        previews.push(URL.createObjectURL(compressed));
      }

      setImageFiles(prev => [...prev, ...compressedFiles]);
      setImagePreviews(prev => [...prev, ...previews]);
    } catch (err) {
      console.error("Image compression error:", err);
      alert("Ошибка при сжатии изображения");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images to Supabase and get URLs
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const formData = new FormData();
    for (const file of imageFiles) {
      formData.append("files", file);
    }

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Ошибка загрузки фото");
    }

    const data = await res.json();
    return data.urls || [];
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !price || isNaN(Number(price))) {
      alert("Заполните название и корректную цену товара");
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    try {
      // 1. Upload images first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      // 2. Create product with image URLs
      const res = await fetch("/api/admin/products/used", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId,
          title: title.trim(),
          batteryHealth: Number(batteryHealth),
          region,
          hasBox,
          defects: defects.trim() || null,
          price: Number(price),
          images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset form
        setTitle("");
        setBatteryHealth(90);
        setRegion("LL/A");
        setHasBox(true);
        setDefects("");
        setPrice("");
        // Cleanup image previews
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);

        setShowSuccess(true);
        router.refresh();

        setTimeout(() => {
          setShowSuccess(false);
        }, 4000);
      } else {
        alert(data.error || "Ошибка при создании Б/У товара");
      }
    } catch (err: any) {
      console.error("Error submitting used product:", err);
      alert(err.message || "Ошибка сети при отправке формы");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="w-10 h-10 rounded-glass-btn bg-[#FF9500]/15 border border-[#FF9500]/25 flex items-center justify-center text-[#FF9500]">
          <PlusCircle size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
            Добавить Б/У устройство
          </h2>
          <p className="text-[11px] text-white/30">
            Заполните параметры смартфона или гаджета
          </p>
        </div>
      </div>

      {/* Success Banner Notification */}
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
                Товар успешно опубликован!
              </p>
              <p className="text-[11px] text-[#34C759]/80">
                Устройство теперь отображается в каталоге магазина
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group 0: Photo Upload */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-3">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <Camera size={14} className="text-[#5AC8FA]" />
          Фотографии ({imageFiles.length}/{MAX_IMAGES})
        </p>

        {/* Image Preview Grid */}
        <div className="grid grid-cols-3 gap-2">
          {imagePreviews.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
            >
              <img
                src={url}
                alt={`Фото ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#FF3B30]/80 transition-colors"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] text-white font-bold">
                {idx + 1}
              </div>
            </div>
          ))}

          {/* Add Photo Button */}
          {imageFiles.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-white/50 hover:border-white/25 transition-all cursor-pointer"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <ImageIcon size={20} />
                  <span className="text-[9px] font-bold">Добавить</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-[10px] text-white/20">
          До {MAX_IMAGES} фото. JPG, PNG, WebP. Макс. 5MB каждое. Фото автоматически сжимаются.
        </p>
      </div>

      {/* Group 1: Basic Info (Title & Price) */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone size={14} className="text-[#007AFF]" />
          Основная информация
        </p>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-white/60">
            Название устройства *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="например, iPhone 15 Pro 256GB Space Black"
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.03] transition-all font-semibold"
          />
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-white/60 flex items-center justify-between">
            <span>Цена ($ USD) *</span>
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="850"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.03] transition-all font-bold text-[#007AFF]"
            />
          </div>
        </div>
      </div>

      {/* Group 2: Device Specs (Battery, Region, Box) */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <BatteryCharging size={14} className="text-[#FF9500]" />
          Характеристики и Комплектация
        </p>

        {/* Battery Health Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-white/60 flex items-center gap-1.5">
              <BatteryCharging size={14} className="text-[#34C759]" />
              Емкость АКБ
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759] font-extrabold border border-[#34C759]/30 text-[11px]">
              {batteryHealth}%
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            value={batteryHealth}
            onChange={(e) => setBatteryHealth(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#34C759]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-white/60 flex items-center gap-1.5">
              <Globe size={14} className="text-[#007AFF]" />
              Регион
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-3 py-3 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 appearance-none font-medium"
            >
              {REGION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#111113]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Box/Kit Toggle */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-white/60 flex items-center gap-1.5">
              <Package size={14} className="text-[#FF9500]" />
              Комплект
            </label>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setHasBox(!hasBox)}
              className={`
                w-full py-3 rounded-glass-sm text-[13px] font-bold transition-all border
                ${
                  hasBox
                    ? "bg-[#34C759]/20 text-[#34C759] border-[#34C759]/30"
                    : "bg-white/[0.02] text-white/40 border-white/[0.04]"
                }
              `}
            >
              {hasBox ? "С коробкой" : "Без коробки"}
            </motion.button>
          </div>
        </div>

        {/* Defects */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[12px] font-bold text-white/60 flex items-center gap-1.5">
            <FileText size={14} className="text-[#FF3B30]" />
            Дефекты и ремонт
          </label>
          <textarea
            rows={2}
            value={defects}
            onChange={(e) => setDefects(e.target.value)}
            placeholder="Если устройство в идеале, оставьте поле пустым. Иначе опишите царапины, замены экрана и т.д."
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-4 py-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-white/[0.03] transition-all font-normal resize-none"
          />
        </div>
      </div>

      {/* Main Submit Button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          transition={tapSpring}
          disabled={isLoading || !title.trim() || !price}
          className={`
            w-full py-4 rounded-glass-btn text-[15px] font-bold transition-all
            ${
              isLoading || !title.trim() || !price
                ? "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
                : "btn-system-blue"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {imageFiles.length > 0 ? "Загрузка фото..." : "Создание товара..."}
            </span>
          ) : (
            `Опубликовать Б/У товар${imageFiles.length > 0 ? ` (${imageFiles.length} фото)` : ""}`
          )}
        </motion.button>
      </div>
    </form>
  );
}
