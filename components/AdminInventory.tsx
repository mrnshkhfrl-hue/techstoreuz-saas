"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box, Package, Archive, Layers } from "lucide-react";

interface ProductVariant {
  id: number;
  attributes: Record<string, string>;
  condition: "NEW" | "USED";
  status: "AVAILABLE" | "RESERVED" | "HIDDEN";
  price: number;
  stock: number;
  sku: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  variants: ProductVariant[];
}

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const initData = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initData || "" : "";

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/admin/variants", {
        headers: { "X-Init-Data": initData || "" }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        alert("Failed to load inventory");
      }
    } catch (error) {
      alert("An error occurred while fetching");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initData) fetchInventory();
  }, [initData]);

  const toggleAction = async (variantId: number, action: "RESERVE" | "MAKE_AVAILABLE" | "SELL_OFFLINE") => {
    try {
      const res = await fetch("/api/admin/variants/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Init-Data": initData || ""
        },
        body: JSON.stringify({ variantId, action })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic update
        setProducts(prev => prev.map(p => ({
          ...p,
          variants: p.variants.map(v => v.id === variantId ? data.variant : v)
        })));
      } else {
        alert(data.error || "Failed to update");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-40">
        <div className="w-8 h-8 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="w-10 h-10 rounded-glass-btn bg-[#FF9500]/10 border border-[#FF9500]/12 flex items-center justify-center text-[#FF9500]">
          <Archive size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
            Управление складом (POS)
          </h2>
          <p className="text-[11px] text-white/30">
            Остатки, бронирование и офлайн продажи
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
            {/* Product Header */}
            <div className="bg-white/[0.02] px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#007AFF]" />
                <h3 className="font-bold text-[14px] text-white tracking-tight">{product.name}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/50 uppercase tracking-widest font-bold">
                {product.category}
              </span>
            </div>

            {/* Variants */}
            <div className="divide-y divide-white/[0.04]">
              {product.variants.length === 0 ? (
                <div className="p-5 text-sm text-white/30 text-center font-medium">
                  Нет доступных вариантов
                </div>
              ) : (
                product.variants.map(variant => (
                  <div key={variant.id} className="p-4 flex flex-col gap-3">
                    
                    {/* Variant Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-white/40">
                          {variant.sku.slice(0, 8)}
                        </span>
                        
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          variant.condition === 'NEW' 
                            ? 'bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/25' 
                            : 'bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/25'
                        }`}>
                          {variant.condition === "NEW" ? "НОВЫЙ" : "Б/У"}
                        </span>

                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          variant.status === 'AVAILABLE' ? 'bg-[#34C759]/20 text-[#34C759] border-[#34C759]/30' : 
                          variant.status === 'RESERVED' ? 'bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/25' : 'bg-white/[0.04] text-white/40 border-white/[0.04]'
                        }`}>
                          {variant.status === "AVAILABLE" ? "ДОСТУПЕН" : variant.status === "RESERVED" ? "БРОНЬ" : "СКРЫТ"}
                        </span>
                      </div>
                      <div className="text-[14px] font-black text-white">
                        ${variant.price}
                      </div>
                    </div>

                    {/* Attributes */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <span key={key} className="bg-white/[0.02] px-2 py-1 rounded-glass-xs border border-white/[0.04] text-[11px] text-white/70">
                          {value as string}
                        </span>
                      ))}
                    </div>

                    {/* Stock & Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Package size={14} className={variant.stock > 0 ? "text-[#34C759]" : "text-[#FF3B30]"} />
                        <span className={`text-[12px] font-bold ${variant.stock > 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                          {variant.stock} шт
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {variant.status === 'AVAILABLE' ? (
                          <motion.button 
                            whileTap={{ scale: 0.92 }}
                            transition={tapSpring}
                            onClick={() => toggleAction(variant.id, 'RESERVE')}
                            className="px-3 py-2 text-[11px] font-bold bg-[#FF9500]/15 text-[#FF9500] hover:bg-[#FF9500]/25 rounded-glass-btn border border-[#FF9500]/25 transition-colors cursor-pointer"
                          >
                            В бронь
                          </motion.button>
                        ) : (
                          <motion.button 
                            whileTap={{ scale: 0.92 }}
                            transition={tapSpring}
                            onClick={() => toggleAction(variant.id, 'MAKE_AVAILABLE')}
                            className="px-3 py-2 text-[11px] font-bold bg-[#34C759]/20 text-[#34C759] hover:bg-[#34C759]/30 rounded-glass-btn border border-[#34C759]/30 transition-colors cursor-pointer"
                          >
                            В продажу
                          </motion.button>
                        )}

                        <motion.button 
                          whileTap={{ scale: 0.92 }}
                          transition={tapSpring}
                          onClick={() => toggleAction(variant.id, 'SELL_OFFLINE')}
                          disabled={variant.stock === 0}
                          className="px-3 py-2 text-[11px] font-bold btn-system-blue rounded-glass-btn disabled:bg-white/[0.04] disabled:text-white/20 disabled:border-white/[0.04] transition-colors cursor-pointer"
                        >
                          Офлайн
                        </motion.button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
