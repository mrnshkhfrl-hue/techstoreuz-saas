"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminBookingItem from "@/components/AdminBookingItem";
import AdminUsedInventory from "@/components/AdminUsedInventory";
import AdminNewInventory from "@/components/AdminNewInventory";
import AdminCRM, { CustomerItem } from "@/components/AdminCRM";
import AdminMarketing from "@/components/AdminMarketing";
import AdminAIParser from "@/components/AdminAIParser";
import AdminStaffManagement from "@/components/AdminStaffManagement";
import AdminBranches from "@/components/AdminBranches";
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Smartphone,
  Users,
  Store,
  TrendingUp,
  Megaphone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Box,
} from "lucide-react";

type ShopData = {
  id: string;
  name: string;
  currencyRate: number;
  aboutText?: string | null;
  tgLink?: string | null;
  instaLink?: string | null;
  bookings: Array<any>;
  owner?: any;
  admins?: Array<any>;
  usedProducts?: Array<any>;
  newProducts?: Array<any>;
  branches?: Array<any>;
};

type AdminMainViewProps = {
  shop: ShopData;
  currentAdminId?: string;
  initialCustomers?: CustomerItem[];
};

const NAVIGATION_TABS = [
  "Дашборд",
  "Б/У склад",
  "Новые",
  "Брони",
  "Клиенты",
  "Филиалы",
  "ИИ парсер",
  "Команда",
  "Маркетинг",
];

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminMainView({
  shop,
  currentAdminId,
  initialCustomers = [],
}: AdminMainViewProps) {
  const [activeTab, setActiveTab] = useState("Дашборд");
  const [bookingFilter, setBookingFilter] = useState<string>("ALL");

  // ── Analytics & Metric Calculations ──
  const usedProducts = shop.usedProducts || [];
  const newProducts = shop.newProducts || [];
  const bookings = shop.bookings || [];

  const availableUsedCount = usedProducts.filter((p) => p.status === "AVAILABLE").length;
  const bookedUsedCount = usedProducts.filter((p) => p.status === "BOOKED").length;
  const offlineSoldUsedCount = usedProducts.filter((p) => p.status === "SOLD_OFFLINE").length;
  const onlineSoldUsedCount = usedProducts.filter((p) => p.status === "SOLD_ONLINE").length;

  const totalUsedWarehouseValue = usedProducts
    .filter((p) => p.status === "AVAILABLE")
    .reduce((sum, p) => sum + p.price, 0);

  const activeBookingsCount = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  ).length;

  const completedBookingsCount = bookings.filter((b) => b.status === "COMPLETED").length;

  const totalCompletedRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => {
      const p = b.usedProduct?.price || b.variant?.price || 0;
      return sum + p;
    }, 0);

  // Total Offline Revenue estimate
  const totalOfflineRevenue = usedProducts
    .filter((p) => p.status === "SOLD_OFFLINE")
    .reduce((sum, p) => sum + p.price, 0);

  const totalAllRevenue = totalCompletedRevenue + totalOfflineRevenue;

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "ACTIVE") return b.status === "CONFIRMED" || b.status === "PENDING";
    if (bookingFilter === "COMPLETED") return b.status === "COMPLETED";
    if (bookingFilter === "CANCELLED") return b.status === "CANCELLED";
    return true;
  });

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-black text-white relative overflow-hidden flex flex-col pb-12 sm:border-x border-white/[0.08] font-sans selection:bg-[#007AFF] selection:text-white">
      {/* ═══════════════════════════════════════════════════
          HEADER — Apple Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-[80px] backdrop-saturate-200 bg-black/75 border-b border-white/[0.08] px-5 pt-4 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Панель управления магазином
          </p>
          <a
            href="/"
            className="text-[11px] font-bold text-[#2997FF] hover:text-[#2997FF]/80 flex items-center gap-1 transition-colors"
          >
            ← В витрину
          </a>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white tracking-tight leading-none">
            {shop.name}
          </h1>
          <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/25 text-[#007AFF] text-[10px] font-extrabold uppercase">
            {currentAdminId === "7949519588"
              ? "Супер-Админ"
              : currentAdminId === shop.owner?.telegramId
              ? "Владелец"
              : "Менеджер"}
          </span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          HORIZONTAL SCROLLING NAVIGATION TABS
          ═══════════════════════════════════════════════════ */}
      <div className="px-5 pt-4 pb-2 z-10">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden py-1">
          {NAVIGATION_TABS.map((tab) => {
            const isActive = activeTab === tab;
            let badge = null;
            if (tab === "Брони" && activeBookingsCount > 0) {
              badge = (
                <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse ml-0.5" />
              );
            }
            if (tab === "Б/У склад" && availableUsedCount > 0) {
              badge = (
                <span className="text-[9px] bg-[#34C759]/20 text-[#34C759] px-1.5 py-0.2 rounded-full font-extrabold ml-1">
                  {availableUsedCount}
                </span>
              );
            }

            return (
              <motion.button
                key={tab}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={tapSpring}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center shrink-0 cursor-pointer backdrop-blur-xl border
                  ${
                    isActive
                      ? "bg-white text-black border-white shadow-md shadow-white/10"
                      : "bg-white/[0.03] text-white/50 hover:text-white border-white/[0.06]"
                  }
                `}
              >
                <span>{tab}</span>
                {badge}
              </motion.button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 space-y-6 z-10">
        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════
              TAB 1: ДАШБОРД (АНАЛИТИКА И ОБЗОР)
              ══════════════════════════════════════════════ */}
          {activeTab === "Дашборд" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Statistics Grid */}
              <div className="px-5 pt-1 space-y-3">
                {/* Revenue Card */}
                <div className="p-5 rounded-[26px] bg-gradient-to-br from-[#007AFF]/25 via-white/[0.03] to-transparent border border-[#007AFF]/35 backdrop-blur-2xl relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-[#2997FF] tracking-widest flex items-center gap-1.5">
                      <TrendingUp size={14} />
                      Общая выручка от продаж
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Онлайн + Оффлайн</span>
                  </div>

                  <div>
                    <p className="text-3xl font-black text-white tracking-tight">
                      ${totalAllRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/50 font-semibold mt-0.5">
                      {Math.round(totalAllRevenue * shop.currencyRate).toLocaleString("ru-RU")} сум
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-xs">
                    <div>
                      <p className="text-[10px] text-white/40">Оффлайн в магазине:</p>
                      <p className="font-bold text-[#FF9500]">${totalOfflineRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Онлайн по броням:</p>
                      <p className="font-bold text-[#34C759]">${totalCompletedRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* 4 Quick Stat Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Card 1: Active Bookings */}
                  <div
                    onClick={() => setActiveTab("Брони")}
                    className="p-4 rounded-[22px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <ShoppingBag size={16} className="text-[#007AFF]" />
                      <span className="text-[10px] font-bold text-white/30 uppercase">Брони</span>
                    </div>
                    <p className="text-2xl font-black text-white">{activeBookingsCount}</p>
                    <p className="text-[10px] text-white/40">ожидают выкупа →</p>
                  </div>

                  {/* Card 2: Used In Stock */}
                  <div
                    onClick={() => setActiveTab("Б/У склад")}
                    className="p-4 rounded-[22px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone size={16} className="text-[#34C759]" />
                      <span className="text-[10px] font-bold text-white/30 uppercase">Б/У склад</span>
                    </div>
                    <p className="text-2xl font-black text-[#34C759]">{availableUsedCount}</p>
                    <p className="text-[10px] text-white/40">${totalUsedWarehouseValue.toLocaleString()} в наличии →</p>
                  </div>

                  {/* Card 3: Customers */}
                  <div
                    onClick={() => setActiveTab("Клиенты")}
                    className="p-4 rounded-[22px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Users size={16} className="text-[#FF9500]" />
                      <span className="text-[10px] font-bold text-white/30 uppercase">Клиенты</span>
                    </div>
                    <p className="text-2xl font-black text-white">{initialCustomers.length}</p>
                    <p className="text-[10px] text-white/40">в базе CRM →</p>
                  </div>

                  {/* Card 4: Currency Rate */}
                  <div
                    onClick={() => setActiveTab("Маркетинг")}
                    className="p-4 rounded-[22px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <DollarSign size={16} className="text-[#AF52DE]" />
                      <span className="text-[10px] font-bold text-white/30 uppercase">Курс USD</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                      {shop.currencyRate.toLocaleString("ru-RU")}
                    </p>
                    <p className="text-[10px] text-white/40">сум / $1 →</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="px-5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  Быстрый доступ к управлению:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab("Б/У склад")}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-all"
                  >
                    <Store size={16} className="text-[#FF9500] mb-1" />
                    <p className="text-xs font-bold text-white">Оффлайн продажи</p>
                    <p className="text-[10px] text-white/40">Списать проданное в магазине</p>
                  </button>

                  <button
                    onClick={() => setActiveTab("Клиенты")}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-all"
                  >
                    <Users size={16} className="text-[#007AFF] mb-1" />
                    <p className="text-xs font-bold text-white">База клиентов (CRM)</p>
                    <p className="text-[10px] text-white/40">Контакты и история от А до Я</p>
                  </button>
                </div>
              </div>

              {/* Recent Bookings in Dashboard */}
              <div className="px-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={15} className="text-[#007AFF]" />
                    Последние бронирования
                  </h2>
                  <button
                    onClick={() => setActiveTab("Брони")}
                    className="text-xs text-[#2997FF] font-bold hover:underline"
                  >
                    Все брони ({bookings.length}) →
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-6 rounded-[22px] bg-white/[0.02] border border-white/[0.05] text-center space-y-2">
                    <ShoppingBag size={24} className="text-white/20 mx-auto" />
                    <p className="text-xs text-white/40">Бронирований пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <AdminBookingItem booking={booking} key={booking.id} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2: Б/У СКЛАД (НАЛИЧИЕ, ЦЕНЫ, ОФФЛАЙН POS)
              ══════════════════════════════════════════════ */}
          {activeTab === "Б/У склад" && (
            <motion.div
              key="used-inventory"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminUsedInventory
                shopId={shop.id}
                initialProducts={shop.usedProducts || []}
                currencyRate={shop.currencyRate}
              />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 3: НОВЫЕ ТОВАРЫ (МОДЕЛИ, ВАРИАЦИИ, ОСТАТКИ)
              ══════════════════════════════════════════════ */}
          {activeTab === "Новые" && (
            <motion.div
              key="new-inventory"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminNewInventory
                shopId={shop.id}
                initialTemplates={shop.newProducts || []}
                currencyRate={shop.currencyRate}
              />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 4: БРОНИ (УПРАВЛЕНИЕ ЗАКАЗАМИ)
              ══════════════════════════════════════════════ */}
          {activeTab === "Брони" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Бронирования устройств
                  </h2>
                  <p className="text-xs text-white/50">
                    Удержание товаров клиентами на 24 часа
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-bold text-white/70">
                  {filteredBookings.length}
                </span>
              </div>

              {/* Booking filter tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden py-0.5">
                {[
                  { key: "ALL", label: `Все (${bookings.length})` },
                  { key: "ACTIVE", label: `Активные (${activeBookingsCount})` },
                  { key: "COMPLETED", label: `Куплено (${completedBookingsCount})` },
                  {
                    key: "CANCELLED",
                    label: `Отменено (${bookings.filter((b) => b.status === "CANCELLED").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      bookingFilter === tab.key
                        ? "bg-white text-black shadow-sm"
                        : "bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredBookings.length === 0 ? (
                <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
                  <ShoppingBag size={28} className="text-white/20 mx-auto" />
                  <p className="text-sm font-bold text-white/50">Бронирований не найдено</p>
                  <p className="text-xs text-white/30">Новые брони появятся здесь моментально</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredBookings.map((booking) => (
                    <AdminBookingItem booking={booking} key={booking.id} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 5: КЛИЕНТЫ (CRM БАЗА ОТ А ДО Я)
              ══════════════════════════════════════════════ */}
          {activeTab === "Клиенты" && (
            <motion.div
              key="crm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminCRM
                customers={initialCustomers}
                currencyRate={shop.currencyRate}
              />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 6: ФИЛИАЛЫ МАГАЗИНА
              ══════════════════════════════════════════════ */}
          {activeTab === "Филиалы" && (
            <motion.div
              key="branches"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-5 pt-1"
            >
              <AdminBranches
                shopId={shop.id}
                initialBranches={shop.branches || []}
              />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: ИИ ПАРСЕР ТЕКСТА
              ══════════════════════════════════════════════ */}
          {activeTab === "ИИ парсер" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-5 pt-1"
            >
              <AdminAIParser shopId={shop.id} />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: КОМАНДА МАГАЗИНА (АДМИНИСТРАТОРЫ)
              ══════════════════════════════════════════════ */}
          {activeTab === "Команда" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pt-1"
            >
              <AdminStaffManagement
                shopId={shop.id}
                currentAdminId={currentAdminId || shop.owner?.telegramId || "8603067434"}
                owner={shop.owner || null}
                initialAdmins={shop.admins || []}
              />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 8: МАРКЕТИНГ И НАСТРОЙКИ
              ══════════════════════════════════════════════ */}
          {activeTab === "Маркетинг" && (
            <motion.div
              key="marketing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pt-1"
            >
              <AdminMarketing
                shopId={shop.id}
                initialRate={shop.currencyRate}
                initialAboutText={shop.aboutText || null}
                initialTgLink={shop.tgLink || null}
                initialInstaLink={shop.instaLink || null}
                shopName={shop.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
