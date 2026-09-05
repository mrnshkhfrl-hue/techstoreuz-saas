"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Bookmark, User, Settings, LucideIcon } from "lucide-react";

export type NavTab = "catalog" | "cart" | "bookings" | "profile" | "settings";

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDark: boolean;
  lang: "RU" | "UZ";
  cartCount?: number;
  bookingsCount?: number;
  onHaptic?: () => void;
}

export default function BottomNavBar({
  activeTab,
  onTabChange,
  isDark,
  lang,
  cartCount = 0,
  bookingsCount = 0,
  onHaptic,
}: BottomNavBarProps) {
  const tabs: { key: NavTab; label: string; icon: LucideIcon }[] = [
    {
      key: "catalog",
      label: lang === "RU" ? "Каталог" : "Katalog",
      icon: Home,
    },
    {
      key: "bookings",
      label: lang === "RU" ? "Брони" : "Bandlov",
      icon: Bookmark,
    },
    {
      key: "cart",
      label: lang === "RU" ? "Корзина" : "Savat",
      icon: ShoppingBag,
    },
    {
      key: "profile",
      label: lang === "RU" ? "Профиль" : "Profil",
      icon: User,
    },
    {
      key: "settings",
      label: lang === "RU" ? "Настройки" : "Sozlamalar",
      icon: Settings,
    },
  ];

  const handleSelect = (key: NavTab) => {
    if (onHaptic) onHaptic();
    onTabChange(key);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[430px] px-3 pb-3 pointer-events-auto">
        <nav
          className={`
            relative w-full h-[66px] rounded-[26px] px-1.5 flex items-center justify-between
            transition-all duration-300 shadow-2xl
            ${
              isDark
                ? "bg-[#0a0a0f]/80 border border-white/[0.12] text-white shadow-black/80"
                : "bg-white/85 border border-black/[0.08] text-[#1C1C1E] shadow-black/10"
            }
            backdrop-blur-2xl
          `}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            const badgeCount =
              tab.key === "cart" ? cartCount : tab.key === "bookings" ? bookingsCount : 0;

            return (
              <button
                key={tab.key}
                onClick={() => handleSelect(tab.key)}
                className={`
                  relative flex-1 h-[52px] rounded-[20px] flex flex-col items-center justify-center
                  transition-all duration-200 outline-none cursor-pointer select-none
                  ${isActive ? "font-bold" : "font-medium opacity-60 hover:opacity-85"}
                `}
              >
                {/* Active fluid pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className={`
                      absolute inset-0 rounded-[20px]
                      ${
                        isDark
                          ? "bg-white/[0.12] border border-white/[0.15] shadow-inner"
                          : "bg-black/[0.06] border border-black/[0.08] shadow-inner"
                      }
                    `}
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`
                      transition-transform duration-200
                      ${isActive ? "scale-110 text-[#007AFF]" : isDark ? "text-white/80" : "text-[#1C1C1E]/80"}
                    `}
                  />

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#007AFF] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in-50">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>

                {/* Tab Label */}
                <span
                  className={`
                    relative z-10 text-[10px] tracking-tight mt-1 leading-none
                    ${isActive ? (isDark ? "text-white" : "text-[#1C1C1E]") : isDark ? "text-white/60" : "text-[#1C1C1E]/60"}
                  `}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
