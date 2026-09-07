"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminBookingItem from "@/components/AdminBookingItem";
import AdminAIParser from "@/components/AdminAIParser";
import AdminAddNewProduct from "@/components/AdminAddNewProduct";
import AdminAddUsedProduct from "@/components/AdminAddUsedProduct";
import AdminStaffManagement from "@/components/AdminStaffManagement";
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Smartphone,
  Users,
} from "lucide-react";

type ShopData = {
  id: string;
  name: string;
  currencyRate: number;
  bookings: Array<any>;
  owner?: any;
  admins?: Array<any>;
};

type AdminMainViewProps = {
  shop: ShopData;
  currentAdminId?: string;
};

const NAVIGATION_TABS = ["Дашборд", "Новые", "Б/У", "ИИ", "Брони", "Команда"];

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminMainView({ shop, currentAdminId }: AdminMainViewProps) {
  const [activeTab, setActiveTab] = useState("Дашборд");

  const activeBookingsCount = shop.bookings.filter(
    (b) => b.status === "PENDING"
  ).length;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-black text-white relative overflow-hidden flex flex-col pb-12 sm:border-x border-white/[0.08] font-sans selection:bg-[#007AFF] selection:text-white">

      {/* ═══════════════════════════════════════════════════
          COMPACT HEADER — Liquid Glass
          ═══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-[80px] backdrop-saturate-200 bg-black/75 border-b border-white/[0.08] px-5 pt-4 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Панель управления
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
            return (
              <motion.button
                key={tab}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={tapSpring}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-glass-sm text-xs font-bold transition-all duration-200 flex-shrink-0 cursor-pointer backdrop-blur-xl border
                  ${
                    isActive
                      ? "bg-white text-black border-white shadow-md shadow-white/10"
                      : "bg-white/[0.02] text-white/40 hover:text-white/60 border-white/[0.04]"
                  }
                `}
              >
                {tab}
              </motion.button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 space-y-6 z-10">
        {/* ── TAB 1: Дашборд ── */}
        <AnimatePresence mode="wait">
        {activeTab === "Дашборд" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Statistics Cards Grid */}
            <div className="px-5 pt-1">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Card 1: Active Bookings */}
                <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-glass-xs bg-[#007AFF]/10 border border-[#007AFF]/12 flex items-center justify-center text-[#007AFF]">
                      <ShoppingBag size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">
                      Активные
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white leading-none mb-1 tracking-tight">
                    {activeBookingsCount}
                  </p>
                  <p className="text-[11px] font-medium text-white/30">
                    {activeBookingsCount === 1 ? "заказ ожидает" : "заказов ожидают"}
                  </p>
                </div>

                {/* Card 2: Currency Rate */}
                <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-glass-xs bg-[#34C759]/10 border border-[#34C759]/12 flex items-center justify-center text-[#34C759]">
                      <DollarSign size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">
                      Курс USD
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white leading-none mb-1 tracking-tight">
                    {shop.currencyRate.toLocaleString("ru-RU")}
                  </p>
                  <p className="text-[11px] font-medium text-white/30">
                    сум / $1 USD
                  </p>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="px-5 space-y-4">
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Calendar size={18} className="text-[#007AFF]" />
                  Последние бронирования
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] text-xs font-bold text-white/30">
                  {shop.bookings.length}
                </span>
              </div>

              {shop.bookings.length === 0 ? (
                <div className="p-8 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] text-center space-y-2">
                  <ShoppingBag size={28} className="text-white/15 mx-auto" />
                  <p className="text-sm font-semibold text-white/50">
                    Бронирований пока нет
                  </p>
                  <p className="text-xs text-white/25">
                    Новые бронирования появятся здесь автоматически
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {shop.bookings.map((booking) => (
                    <AdminBookingItem booking={booking} key={booking.id} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB 2: Новые ── */}
        {activeTab === "Новые" && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-1"
          >
            <AdminAddNewProduct shopId={shop.id} />
          </motion.div>
        )}

        {/* ── TAB 3: Б/У ── */}
        {activeTab === "Б/У" && (
          <motion.div
            key="used"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-1"
          >
            <AdminAddUsedProduct shopId={shop.id} />
          </motion.div>
        )}

        {/* ── TAB 4: Брони ── */}
        {activeTab === "Брони" && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-1 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar size={18} className="text-[#007AFF]" />
                Все бронирования
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] text-xs font-bold text-white/30">
                {shop.bookings.length}
              </span>
            </div>

            {shop.bookings.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] text-center space-y-2">
                <ShoppingBag size={28} className="text-white/15 mx-auto" />
                <p className="text-sm font-semibold text-white/50">
                  Бронирований пока нет
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {shop.bookings.map((booking) => (
                  <AdminBookingItem booking={booking} key={booking.id} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 5: ИИ ── */}
        {activeTab === "ИИ" && (
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

        {/* ── TAB 6: Команда (Администраторы магазина) ── */}
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
        </AnimatePresence>
      </main>
    </div>
  );
}
