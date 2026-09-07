"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Battery,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Store,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import AdminAddUsedProduct from "@/components/AdminAddUsedProduct";
import { getModelPhoto } from "@/lib/product-images";

interface UsedItem {
  id: string;
  shopId: string;
  title: string;
  batteryHealth: number;
  region: string;
  hasBox: boolean;
  defects: string | null;
  images: string | null;
  price: number;
  status: "AVAILABLE" | "BOOKED" | "SOLD_ONLINE" | "SOLD_OFFLINE";
  createdAt?: string;
}

interface AdminUsedInventoryProps {
  shopId: string;
  initialProducts: UsedItem[];
  currencyRate: number;
}

export default function AdminUsedInventory({
  shopId,
  initialProducts,
  currencyRate,
}: AdminUsedInventoryProps) {
  const [products, setProducts] = useState<UsedItem[]>(initialProducts || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Status counters
  const totalCount = products.length;
  const availableCount = products.filter((p) => p.status === "AVAILABLE").length;
  const bookedCount = products.filter((p) => p.status === "BOOKED").length;
  const offlineSoldCount = products.filter((p) => p.status === "SOLD_OFFLINE").length;
  const onlineSoldCount = products.filter((p) => p.status === "SOLD_ONLINE").length;
  const totalValueUsd = products
    .filter((p) => p.status === "AVAILABLE")
    .reduce((sum, p) => sum + p.price, 0);

  // Filtered list
  const filteredProducts = products.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      String(item.batteryHealth).includes(q)
    );
  });

  const handleUpdateStatus = async (
    id: string,
    newStatus: "AVAILABLE" | "BOOKED" | "SOLD_ONLINE" | "SOLD_OFFLINE"
  ) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/products/used", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка обновления");

      setProducts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePrice = async (id: string) => {
    const num = Number(newPriceInput);
    if (isNaN(num) || num <= 0) {
      alert("Введите корректную цену");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/products/used", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка обновления цены");

      setProducts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, price: num } : item))
      );
      setEditingPriceId(null);
      setNewPriceInput("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Вы точно хотите удалить устройство "${title}" из базы?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/products/used?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка удаления");
      }

      setProducts((prev) => prev.filter((item) => item.id !== id));
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
          <h2 className="text-base font-bold text-white">Добавление Б/У устройства</h2>
          <button
            onClick={() => setShowAddForm(false)}
            className="text-xs text-[#2997FF] hover:underline font-bold"
          >
            ← Вернуться к списку
          </button>
        </div>
        <AdminAddUsedProduct shopId={shopId} />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 pb-12 font-sans">
      {/* ── 1. Statistics Cards Header ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Всего Б/У</p>
          <p className="text-xl font-black text-white mt-1">{totalCount}</p>
          <p className="text-[10px] text-white/30">устройств в базе</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#34C759] tracking-wider">В наличии</p>
          <p className="text-xl font-black text-[#34C759] mt-1">{availableCount}</p>
          <p className="text-[10px] text-[#34C759]/60">доступно клиентам</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#FF9500] tracking-wider">Оффлайн продажи</p>
          <p className="text-xl font-black text-[#FF9500] mt-1">{offlineSoldCount}</p>
          <p className="text-[10px] text-[#FF9500]/60">продано в магазине</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#007AFF] tracking-wider">Сумма склада</p>
          <p className="text-xl font-black text-white mt-1">${totalValueUsd.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">в наличии</p>
        </div>
      </div>

      {/* ── 2. Action Bar & Add Button ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по модели (например 13 Pro)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#007AFF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Добавить</span>
        </button>
      </div>

      {/* ── 3. Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden py-0.5">
        {[
          { key: "ALL", label: `Все (${totalCount})` },
          { key: "AVAILABLE", label: `В наличии (${availableCount})` },
          { key: "BOOKED", label: `Забронировано (${bookedCount})` },
          { key: "SOLD_OFFLINE", label: `Продано в магазине (${offlineSoldCount})` },
          { key: "SOLD_ONLINE", label: `Продано онлайн (${onlineSoldCount})` },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.06]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. Products List ── */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <Smartphone size={32} className="mx-auto text-white/20" />
            <p className="text-sm font-bold text-white/50">Товары не найдены</p>
            <p className="text-xs text-white/30">Попробуйте изменить поисковый запрос или фильтр</p>
          </div>
        ) : (
          filteredProducts.map((item) => {
            const isEditing = editingPriceId === item.id;
            const photoUrl = parsePhotos(item.images, item.title);

            let statusBadge = {
              text: "В наличии",
              bg: "bg-[#34C759]/15 border-[#34C759]/30 text-[#34C759]",
            };
            if (item.status === "BOOKED") {
              statusBadge = {
                text: "Забронирован",
                bg: "bg-[#007AFF]/15 border-[#007AFF]/30 text-[#007AFF]",
              };
            } else if (item.status === "SOLD_OFFLINE") {
              statusBadge = {
                text: "Продано оффлайн (в магазине)",
                bg: "bg-[#FF9500]/15 border-[#FF9500]/30 text-[#FF9500]",
              };
            } else if (item.status === "SOLD_ONLINE") {
              statusBadge = {
                text: "Продано онлайн",
                bg: "bg-white/10 border-white/20 text-white/50",
              };
            }

            return (
              <div
                key={item.id}
                className="p-4 rounded-[22px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] backdrop-blur-xl transition-all space-y-3"
              >
                {/* Product Header */}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img
                      src={photoUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate leading-tight">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.bg}`}
                      >
                        {statusBadge.text}
                      </span>
                    </div>

                    {/* Price & Currency */}
                    <div className="mt-1 flex items-baseline gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="number"
                            value={newPriceInput}
                            onChange={(e) => setNewPriceInput(e.target.value)}
                            placeholder={String(item.price)}
                            className="w-20 px-2 py-1 rounded-lg bg-black border border-[#007AFF] text-white text-xs font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="px-2 py-1 rounded-lg bg-[#007AFF] text-white text-[10px] font-bold"
                          >
                            ОК
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="px-1.5 py-1 text-white/40 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white leading-none">
                            ${item.price.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-white/40 font-medium">
                            {Math.round(item.price * currencyRate).toLocaleString("ru-RU")} сум
                          </span>
                          <button
                            onClick={() => {
                              setEditingPriceId(item.id);
                              setNewPriceInput(String(item.price));
                            }}
                            className="text-white/30 hover:text-white"
                            title="Изменить цену"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Specifications Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/70 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Battery size={10} className="text-[#34C759]" />
                        {item.batteryHealth}%
                      </span>
                      <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/70 px-1.5 py-0.5 rounded-md">
                        {item.region}
                      </span>
                      <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/70 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Box size={10} />
                        {item.hasBox ? "Коробка +" : "Без коробки"}
                      </span>
                      {item.defects && (
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate max-w-[160px]">
                          <AlertTriangle size={10} />
                          {item.defects}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggling Action Buttons */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Button 1: Sold Offline (в магазине) */}
                    {item.status !== "SOLD_OFFLINE" && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, "SOLD_OFFLINE")}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FF9500]/15 hover:bg-[#FF9500]/25 border border-[#FF9500]/30 text-[#FF9500] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Клиент купил телефон в магазине (снять с витрины)"
                      >
                        <Store size={12} />
                        <span>Продано оффлайн</span>
                      </button>
                    )}

                    {/* Button 2: Make Available */}
                    {item.status !== "AVAILABLE" && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, "AVAILABLE")}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-lg bg-[#34C759]/15 hover:bg-[#34C759]/25 border border-[#34C759]/30 text-[#34C759] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Вернуть товар в наличие на витрину"
                      >
                        <CheckCircle2 size={12} />
                        <span>В наличие</span>
                      </button>
                    )}

                    {/* Button 3: Sold Online */}
                    {item.status !== "SOLD_ONLINE" && item.status === "BOOKED" && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, "SOLD_ONLINE")}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Подтвердить онлайн продажу по брони"
                      >
                        <span>Продано по брони</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={isUpdating}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Удалить устройство"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
