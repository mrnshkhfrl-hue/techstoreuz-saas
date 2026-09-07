"use client";

import { useState } from "react";
import {
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Search,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AdminAddNewProduct from "@/components/AdminAddNewProduct";
import { getModelPhoto } from "@/lib/product-images";

interface ProductVariant {
  id: string;
  templateId: string;
  color: string;
  storage: string;
  simType: string;
  price: number;
  stock: number;
}

interface NewProductTemplate {
  id: string;
  shopId: string;
  title: string;
  basePrice: number;
  images: string | null;
  variants: ProductVariant[];
}

interface AdminNewInventoryProps {
  shopId: string;
  initialTemplates: NewProductTemplate[];
  currencyRate: number;
}

export default function AdminNewInventory({
  shopId,
  initialTemplates,
  currencyRate,
}: AdminNewInventoryProps) {
  const [templates, setTemplates] = useState<NewProductTemplate[]>(initialTemplates || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalTemplates = templates.length;
  const totalVariants = templates.reduce((sum, t) => sum + (t.variants?.length || 0), 0);
  const totalStock = templates.reduce(
    (sum, t) => sum + (t.variants?.reduce((vSum, v) => vSum + (v.stock || 0), 0) || 0),
    0
  );

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    return t.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleUpdateVariantStock = async (variantId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setIsUpdating(true);

    try {
      const res = await fetch("/api/admin/products/new", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stock: newStock }),
      });
      if (!res.ok) throw new Error("Ошибка обновления остатка");

      setTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          variants: t.variants.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v)),
        }))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`Вы точно хотите удалить модель "${title}" и все её вариации?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/products/new?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const parsePhotos = (raw: string | null, title: string): string => {
    if (!raw) return getModelPhoto(title);
    try {
      if (raw.startsWith("[")) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr[0]) return arr[0];
      }
      return raw.split(",")[0]?.trim() || getModelPhoto(title);
    } catch {
      return getModelPhoto(title);
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-4 px-5 pb-8 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Добавление новой модели</h2>
          <button
            onClick={() => setShowAddForm(false)}
            className="text-xs text-[#2997FF] hover:underline font-bold"
          >
            ← Вернуться к списку
          </button>
        </div>
        <AdminAddNewProduct shopId={shopId} />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 pb-12 font-sans">
      {/* ── 1. Statistics Cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Моделей</p>
          <p className="text-xl font-black text-white mt-1">{totalTemplates}</p>
          <p className="text-[10px] text-white/30">линеек iPhone</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#007AFF] tracking-wider">Конфигураций</p>
          <p className="text-xl font-black text-[#007AFF] mt-1">{totalVariants}</p>
          <p className="text-[10px] text-[#007AFF]/60">память/цвет</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#34C759] tracking-wider">Остаток</p>
          <p className="text-xl font-black text-[#34C759] mt-1">{totalStock}</p>
          <p className="text-[10px] text-[#34C759]/60">штук на складе</p>
        </div>
      </div>

      {/* ── 2. Action Bar ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию (например 16 Pro)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#007AFF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Добавить модель</span>
        </button>
      </div>

      {/* ── 3. Templates List ── */}
      <div className="space-y-3">
        {filteredTemplates.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <Smartphone size={32} className="mx-auto text-white/20" />
            <p className="text-sm font-bold text-white/50">Модели не найдены</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isExpanded = expandedId === template.id;
            const photoUrl = parsePhotos(template.images, template.title);
            const templateStock =
              template.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

            return (
              <div
                key={template.id}
                className="rounded-[22px] bg-white/[0.03] border border-white/[0.07] overflow-hidden backdrop-blur-xl transition-all"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={photoUrl}
                        alt={template.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {template.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-white">
                          от ${template.basePrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          • {template.variants?.length || 0} вариаций
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            templateStock > 0
                              ? "bg-[#34C759]/15 text-[#34C759]"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {templateStock > 0 ? `${templateStock} шт.` : "Нет на складе"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id, template.title);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Удалить модель"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="text-white/40">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Variants List (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] bg-black/30 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                      Остатки по модификациям:
                    </p>

                    <div className="space-y-1.5">
                      {template.variants?.map((v) => (
                        <div
                          key={v.id}
                          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-bold text-white">
                              {v.storage} • {v.color}
                            </span>
                            <span className="text-[10px] text-white/40 ml-2">({v.simType})</span>
                            <p className="text-[11px] text-[#2997FF] font-semibold mt-0.5">
                              ${v.price.toLocaleString()} •{" "}
                              {Math.round(v.price * currencyRate).toLocaleString("ru-RU")} сум
                            </p>
                          </div>

                          {/* Quick Stock Counter */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleUpdateVariantStock(v.id, v.stock, -1)}
                              disabled={isUpdating || v.stock <= 0}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-white">
                              {v.stock}
                            </span>
                            <button
                              onClick={() => handleUpdateVariantStock(v.id, v.stock, 1)}
                              disabled={isUpdating}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
