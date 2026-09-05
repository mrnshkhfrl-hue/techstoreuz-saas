"use client";

import React, { useRef, useState, useCallback } from "react";
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
  const navRef = useRef<HTMLElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const activeTabRef = useRef<NavTab>(activeTab);
  activeTabRef.current = activeTab;

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

  // Telegram Haptic Feedback helpers
  const triggerHapticSelection = useCallback(() => {
    try {
      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
      }
    } catch {}
    if (onHaptic) onHaptic();
  }, [onHaptic]);

  const triggerHapticImpact = useCallback((style: "light" | "medium" = "light") => {
    try {
      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(style);
      }
    } catch {}
  }, []);

  // Calculate tab key based on horizontal coordinate
  const getTabFromX = useCallback(
    (clientX: number): NavTab | null => {
      if (!navRef.current) return null;
      const rect = navRef.current.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const relativeX = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width - 0.5, relativeX));
      const tabWidth = rect.width / tabs.length;
      const index = Math.min(tabs.length - 1, Math.max(0, Math.floor(clampedX / tabWidth)));
      return tabs[index]?.key || null;
    },
    [tabs]
  );

  const handleSelect = (key: NavTab) => {
    if (activeTabRef.current !== key) {
      onTabChange(key);
      triggerHapticSelection();
    }
  };

  // ── Touch Events (iOS Safari & Telegram WebApp) ──
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!e.touches[0]) return;
    setIsScrubbing(true);
    const targetTab = getTabFromX(e.touches[0].clientX);
    if (targetTab && targetTab !== activeTabRef.current) {
      onTabChange(targetTab);
      triggerHapticSelection();
    } else {
      triggerHapticImpact("light");
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!e.touches[0]) return;
    const targetTab = getTabFromX(e.touches[0].clientX);
    if (targetTab && targetTab !== activeTabRef.current) {
      onTabChange(targetTab);
      triggerHapticSelection();
    }
  };

  const handleTouchEnd = () => {
    if (isScrubbing) {
      setIsScrubbing(false);
      triggerHapticImpact("light");
    }
  };

  // ── Pointer Events (Desktop mouse dragging & Android) ──
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    setIsScrubbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const targetTab = getTabFromX(e.clientX);
    if (targetTab && targetTab !== activeTabRef.current) {
      onTabChange(targetTab);
      triggerHapticSelection();
    } else {
      triggerHapticImpact("light");
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isScrubbing) return;
    const targetTab = getTabFromX(e.clientX);
    if (targetTab && targetTab !== activeTabRef.current) {
      onTabChange(targetTab);
      triggerHapticSelection();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      triggerHapticImpact("light");
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[430px] px-3 pb-3 pointer-events-auto">
        <nav
          ref={navRef}
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`
            relative w-full h-[68px] rounded-[28px] px-1.5 flex items-center justify-between
            transition-all duration-300 shadow-2xl select-none touch-none
            ${
              isDark
                ? "bg-[#0a0a0f]/80 border border-white/[0.14] text-white shadow-black/80"
                : "bg-white/85 border border-black/[0.08] text-[#1C1C1E] shadow-black/10"
            }
            backdrop-blur-2xl
            ${isScrubbing ? "ring-2 ring-[#007AFF]/40 scale-[1.01]" : ""}
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
                type="button"
                onClick={() => handleSelect(tab.key)}
                className={`
                  relative flex-1 h-[54px] rounded-[22px] flex flex-col items-center justify-center
                  transition-all duration-200 outline-none cursor-pointer select-none
                  ${isActive ? "font-bold" : "font-medium opacity-60 hover:opacity-85"}
                `}
              >
                {/* Active fluid Liquid Glass pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{
                      type: "spring",
                      stiffness: isScrubbing ? 580 : 450,
                      damping: isScrubbing ? 28 : 32,
                      mass: 0.5,
                    }}
                    animate={{
                      scale: isScrubbing ? 1.06 : 1,
                    }}
                    className={`
                      absolute inset-0 rounded-[22px] pointer-events-none
                      ${
                        isDark
                          ? isScrubbing
                            ? "bg-white/[0.18] border border-white/[0.25] shadow-[0_0_20px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.6)]"
                            : "bg-white/[0.12] border border-white/[0.15] shadow-inner"
                          : isScrubbing
                            ? "bg-black/[0.10] border border-black/[0.12] shadow-[0_0_16px_rgba(0,122,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                            : "bg-black/[0.06] border border-black/[0.08] shadow-inner"
                      }
                      backdrop-blur-3xl
                    `}
                  >
                    {/* Top specular liquid edge sheen */}
                    <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full opacity-70" />
                  </motion.div>
                )}

                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`
                      transition-transform duration-200
                      ${
                        isActive
                          ? isScrubbing
                            ? "scale-125 text-[#007AFF]"
                            : "scale-110 text-[#007AFF]"
                          : isDark
                            ? "text-white/80"
                            : "text-[#1C1C1E]/80"
                      }
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
                    relative z-10 text-[10px] tracking-tight mt-1 leading-none transition-colors duration-150
                    ${
                      isActive
                        ? isDark
                          ? "text-white"
                          : "text-[#1C1C1E]"
                        : isDark
                          ? "text-white/60"
                          : "text-[#1C1C1E]/60"
                    }
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
