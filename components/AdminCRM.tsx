"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Crown,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Star,
} from "lucide-react";

export interface CustomerHistoryItem {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  productTitle: string;
  price: number;
  isUsed: boolean;
  details: string;
}

export interface CustomerItem {
  id: string;
  telegramId: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  isPremium?: boolean;
  tier: "VIP" | "REGULAR" | "NEW";
  totalBookings: number;
  completedPurchases: number;
  activeBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastActivity: string | null;
  history: CustomerHistoryItem[];
}

interface AdminCRMProps {
  customers: CustomerItem[];
  currencyRate: number;
}

export default function AdminCRM({ customers, currencyRate }: AdminCRMProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "BUYERS" | "ACTIVE" | "VIP">("ALL");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const totalClients = customers.length;
  const totalCompletedSales = customers.reduce((sum, c) => sum + c.completedPurchases, 0);
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipClientsCount = customers.filter((c) => c.tier === "VIP").length;

  const filteredCustomers = customers.filter((client) => {
    if (filter === "BUYERS" && client.completedPurchases === 0) return false;
    if (filter === "ACTIVE" && client.activeBookings === 0) return false;
    if (filter === "VIP" && client.tier !== "VIP") return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      (client.phone && client.phone.toLowerCase().includes(q)) ||
      client.telegramId.includes(q)
    );
  });

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5 px-5 pb-12 font-sans">
      {/* ── 1. Statistics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Клиентов в базе</p>
          <p className="text-xl font-black text-white mt-1">{totalClients}</p>
          <p className="text-[10px] text-white/30">пользователей</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#34C759] tracking-wider">Куплено товаров</p>
          <p className="text-xl font-black text-[#34C759] mt-1">{totalCompletedSales}</p>
          <p className="text-[10px] text-[#34C759]/60">завершенных сделок</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#007AFF] tracking-wider">Выручка от клиентов</p>
          <p className="text-xl font-black text-white mt-1">${totalSpentAll.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">
            {Math.round(totalSpentAll * currencyRate).toLocaleString("ru-RU")} сум
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/20 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-bold text-[#FF9500] tracking-wider">VIP клиенты</p>
          <p className="text-xl font-black text-[#FF9500] mt-1">{vipClientsCount}</p>
          <p className="text-[10px] text-[#FF9500]/60">постоянных покупателей</p>
        </div>
      </div>

      {/* ── 2. Search & Filters ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, номеру телефона или Telegram ID..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden py-0.5">
          {[
            { key: "ALL", label: `Все клиенты (${totalClients})` },
            { key: "BUYERS", label: `С покупками (${customers.filter((c) => c.completedPurchases > 0).length})` },
            { key: "ACTIVE", label: `С активной бронью (${customers.filter((c) => c.activeBookings > 0).length})` },
            { key: "VIP", label: `VIP (${vipClientsCount})` },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
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
      </div>

      {/* ── 3. Customer List ── */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <Users size={32} className="mx-auto text-white/20" />
            <p className="text-sm font-bold text-white/50">Клиенты не найдены</p>
            <p className="text-xs text-white/30">Новые клиенты автоматически регистрируются при бронировании</p>
          </div>
        ) : (
          filteredCustomers.map((client) => {
            const isExpanded = expandedCustomerId === client.id;
            const cleanPhone = client.phone ? client.phone.replace(/[^\d]/g, "") : "";

            let tierBadge = {
              text: "Новый клиент",
              bg: "bg-white/10 text-white/70 border-white/10",
              icon: null,
            };
            if (client.tier === "VIP") {
              tierBadge = {
                text: "VIP Клиент",
                bg: "bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/30",
                icon: <Star size={10} className="fill-[#FF9500]" />,
              };
            } else if (client.tier === "REGULAR") {
              tierBadge = {
                text: "Постоянный",
                bg: "bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30",
                icon: null,
              };
            }

            return (
              <div
                key={client.id}
                className="rounded-[22px] bg-white/[0.03] border border-white/[0.07] overflow-hidden backdrop-blur-xl transition-all"
              >
                {/* Client Main Card */}
                <div
                  onClick={() => setExpandedCustomerId(isExpanded ? null : client.id)}
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#5856D6]/30 border border-white/10 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                        {client.photoUrl ? (
                          <img
                            src={client.photoUrl}
                            alt={client.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          client.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {client.name}
                          </h3>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${tierBadge.bg}`}
                          >
                            {tierBadge.icon}
                            {tierBadge.text}
                          </span>
                        </div>

                        <p className="text-[11px] text-white/40 font-mono mt-0.5">
                          ID: {client.telegramId}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-[#34C759] leading-none">
                        ${client.totalSpent.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {Math.round(client.totalSpent * currencyRate).toLocaleString("ru-RU")} сум
                      </p>
                    </div>
                  </div>

                  {/* Activity Summary Badges */}
                  <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                    <span>📦 Броней: <b>{client.totalBookings}</b></span>
                    <span>✅ Куплено: <b className="text-[#34C759]">{client.completedPurchases}</b></span>
                    <span>❌ Отменено: <b className="text-red-400">{client.cancelledBookings}</b></span>
                    <div className="text-white/40 flex items-center gap-1">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Phone size={12} className="text-[#34C759]" />
                        <span>Позвонить ({client.phone})</span>
                      </a>
                    )}

                    {cleanPhone && (
                      <a
                        href={`https://t.me/+${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <MessageCircle size={12} />
                        <span>Telegram</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Purchase & Booking History (От А до Я) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] bg-black/40 space-y-2.5">
                    <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider flex items-center gap-1">
                      <ShoppingBag size={11} />
                      История действий клиента от А до Я:
                    </p>

                    {client.history.length === 0 ? (
                      <p className="text-xs text-white/30 italic py-2">
                        История бронирований пуста (клиент зарегистрирован, но ещё не оформил бронь)
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {client.history.map((h) => {
                          let badge = { text: "В ожидании", color: "text-amber-400 bg-amber-500/10" };
                          if (h.status === "COMPLETED") {
                            badge = { text: "Куплено ✅", color: "text-[#34C759] bg-[#34C759]/15" };
                          } else if (h.status === "CANCELLED") {
                            badge = { text: "Отменено ❌", color: "text-red-400 bg-red-500/10" };
                          } else if (h.status === "CONFIRMED") {
                            badge = { text: "Активная бронь ⚡", color: "text-[#007AFF] bg-[#007AFF]/15" };
                          }

                          return (
                            <div
                              key={h.id}
                              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-bold text-white leading-tight">
                                  {h.productTitle}
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5">
                                  {h.details} • {formatDate(h.createdAt)}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}
                                >
                                  {badge.text}
                                </span>
                                <p className="text-[11px] font-black text-white mt-1">
                                  ${h.price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
