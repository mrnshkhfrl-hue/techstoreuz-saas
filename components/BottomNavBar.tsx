"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
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

const tabs: { key: NavTab; labelRU: string; labelUZ: string; icon: LucideIcon }[] = [
  { key: "catalog", labelRU: "Каталог", labelUZ: "Katalog", icon: Home },
  { key: "bookings", labelRU: "Брони", labelUZ: "Bandlov", icon: Bookmark },
  { key: "cart", labelRU: "Корзина", labelUZ: "Savat", icon: ShoppingBag },
  { key: "profile", labelRU: "Профиль", labelUZ: "Profil", icon: User },
  { key: "settings", labelRU: "Настройки", labelUZ: "Sozlamalar", icon: Settings },
];

function BottomNavBar({
  activeTab,
  onTabChange,
  isDark,
  lang,
  cartCount = 0,
  bookingsCount = 0,
  onHaptic,
}: BottomNavBarProps) {
  const navRef = useRef<HTMLElement>(null);
  const isScrubbingRef = useRef(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<NavTab | null>(null);
  const hoveredTabRef = useRef<NavTab | null>(null);
  const activeTabRef = useRef<NavTab>(activeTab);
  const rafRef = useRef<number>(0);
  const pillRef = useRef<HTMLDivElement>(null);
  
  activeTabRef.current = activeTab;

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
    []
  );

  // Animate pill position using transforms (fast during scrub, smooth spring at rest)
  const animatePillToTab = useCallback((tabKey: NavTab, fast = false) => {
    if (!pillRef.current || !navRef.current) return;
    const idx = tabs.findIndex(t => t.key === tabKey);
    if (idx < 0) return;
    
    const navRect = navRef.current.getBoundingClientRect();
    const tabWidth = navRect.width / tabs.length;
    const targetX = idx * tabWidth + 6; // 6px = px-1.5 padding
    
    pillRef.current.style.transition = fast 
      ? "transform 0.08s cubic-bezier(0.1, 0.9, 0.2, 1), width 0.08s ease" 
      : "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
    pillRef.current.style.transform = `translateX(${targetX}px)`;
    pillRef.current.style.width = `${tabWidth - 12}px`;
  }, []);

  // Update pill position when activeTab changes (when not scrubbing)
  useEffect(() => {
    if (!isScrubbingRef.current) {
      animatePillToTab(activeTab);
    }
  }, [activeTab, animatePillToTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => animatePillToTab(hoveredTabRef.current || activeTab);
    window.addEventListener("resize", handleResize);
    requestAnimationFrame(() => animatePillToTab(activeTab));
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, animatePillToTab]);

  const handleSelect = useCallback((key: NavTab) => {
    if (activeTabRef.current !== key) {
      onTabChange(key);
      triggerHapticSelection();
    }
  }, [onTabChange, triggerHapticSelection]);

  // Move handler for scrubbing: highlights tab and moves pill, but does NOT switch page!
  const processMove = useCallback((clientX: number) => {
    const targetTab = getTabFromX(clientX);
    if (targetTab && targetTab !== hoveredTabRef.current) {
      hoveredTabRef.current = targetTab;
      setHoveredTab(targetTab);
      animatePillToTab(targetTab, true);
      triggerHapticSelection();
    }
  }, [getTabFromX, animatePillToTab, triggerHapticSelection]);

  // ── Touch Events (iOS Safari & Telegram WebApp) ──
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (!e.touches[0]) return;
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    const targetTab = getTabFromX(e.touches[0].clientX);
    if (targetTab) {
      hoveredTabRef.current = targetTab;
      setHoveredTab(targetTab);
      animatePillToTab(targetTab, true);
      if (targetTab !== activeTabRef.current) {
        triggerHapticSelection();
      } else {
        triggerHapticImpact("light");
      }
    }
  }, [getTabFromX, animatePillToTab, triggerHapticSelection, triggerHapticImpact]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (!e.touches[0] || !isScrubbingRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const clientX = e.touches[0].clientX;
    rafRef.current = requestAnimationFrame(() => {
      processMove(clientX);
    });
  }, [processMove]);

  const handleTouchEnd = useCallback(() => {
    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setIsScrubbing(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const destinationTab = hoveredTabRef.current || activeTabRef.current;
      hoveredTabRef.current = null;
      setHoveredTab(null);
      if (destinationTab !== activeTabRef.current) {
        onTabChange(destinationTab);
        triggerHapticImpact("medium");
      }
      animatePillToTab(destinationTab, false);
    }
  }, [onTabChange, triggerHapticImpact, animatePillToTab]);

  // ── Pointer Events (Desktop mouse dragging & Android) ──
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const targetTab = getTabFromX(e.clientX);
    if (targetTab) {
      hoveredTabRef.current = targetTab;
      setHoveredTab(targetTab);
      animatePillToTab(targetTab, true);
      if (targetTab !== activeTabRef.current) {
        triggerHapticSelection();
      } else {
        triggerHapticImpact("light");
      }
    }
  }, [getTabFromX, animatePillToTab, triggerHapticSelection, triggerHapticImpact]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isScrubbingRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const clientX = e.clientX;
    rafRef.current = requestAnimationFrame(() => {
      processMove(clientX);
    });
  }, [processMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setIsScrubbing(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      const destinationTab = hoveredTabRef.current || activeTabRef.current;
      hoveredTabRef.current = null;
      setHoveredTab(null);
      if (destinationTab !== activeTabRef.current) {
        onTabChange(destinationTab);
        triggerHapticImpact("medium");
      }
      animatePillToTab(destinationTab, false);
    }
  }, [onTabChange, triggerHapticImpact, animatePillToTab]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[430px] px-3 pb-3 pointer-events-auto">
        <nav
          ref={navRef}
          style={{ 
            touchAction: "none",
            contain: "layout style",
            willChange: "auto",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`
            navbar-gpu relative w-full h-[68px] rounded-[28px] px-1.5 flex items-center justify-between
            select-none touch-none
            ${
              isDark
                ? "bg-[#0a0a0f]/80 border border-white/[0.14] text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                : "bg-white/85 border border-black/[0.08] text-[#1C1C1E] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            }
            backdrop-blur-2xl
            ${isScrubbing ? "ring-2 ring-[#007AFF]/40 scale-[1.01]" : ""}
          `}
        >
          {/* GPU-accelerated pill — positioned via transform */}
          <div
            ref={pillRef}
            className={`
              absolute top-[7px] h-[54px] rounded-[22px] pointer-events-none
              navbar-pill-transition
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
            style={{ willChange: "transform", backfaceVisibility: "hidden" }}
          >
            {/* Top specular liquid edge sheen */}
            <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full opacity-70" />
          </div>

          {tabs.map((tab) => {
            const currentTab = isScrubbing && hoveredTab ? hoveredTab : activeTab;
            const isActive = currentTab === tab.key;
            const Icon = tab.icon;
            const badgeCount =
              tab.key === "cart" ? cartCount : tab.key === "bookings" ? bookingsCount : 0;
            const label = lang === "RU" ? tab.labelRU : tab.labelUZ;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelect(tab.key)}
                className={`
                  relative flex-1 h-[54px] rounded-[22px] flex flex-col items-center justify-center
                  outline-none cursor-pointer select-none
                  ${isActive ? "font-bold" : "font-medium opacity-60"}
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? isScrubbing
                          ? "scale-125 text-[#007AFF] transition-transform duration-100"
                          : "scale-110 text-[#007AFF] transition-transform duration-200"
                        : isDark
                          ? "text-white/80 transition-transform duration-200"
                          : "text-[#1C1C1E]/80 transition-transform duration-200"
                    }
                    style={{ willChange: "transform" }}
                  />

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#007AFF] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>

                {/* Tab Label */}
                <span
                  className={`
                    relative z-10 text-[10px] tracking-tight mt-1 leading-none
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
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default React.memo(BottomNavBar);
