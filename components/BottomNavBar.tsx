"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Home, ShoppingBag, Bookmark, User, Settings, LucideIcon } from "lucide-react";

export type NavTab = "catalog" | "bookings" | "profile" | "settings";

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDark: boolean;
  lang: "RU" | "UZ";
  bookingsCount?: number;
  onHaptic?: () => void;
}

const tabs: { key: NavTab; labelRU: string; labelUZ: string; icon: LucideIcon }[] = [
  { key: "catalog", labelRU: "Каталог", labelUZ: "Katalog", icon: Home },
  { key: "bookings", labelRU: "Брони", labelUZ: "Bandlov", icon: Bookmark },
  { key: "profile", labelRU: "Профиль", labelUZ: "Profil", icon: User },
  { key: "settings", labelRU: "Настройки", labelUZ: "Sozlamalar", icon: Settings },
];

function BottomNavBar({
  activeTab,
  onTabChange,
  isDark,
  lang,
  bookingsCount = 0,
  onHaptic,
}: BottomNavBarProps) {
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<NavTab | null>(null);
  const hoveredTabRef = useRef<NavTab | null>(null);
  const activeTabRef = useRef<NavTab>(activeTab);
  const navRectRef = useRef<{ left: number; width: number } | null>(null);
  const didDragRef = useRef(false);

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

  // Animate pill position using hardware transforms and Apple iOS spring
  const animatePillToTab = useCallback((tabKey: NavTab, fast = false) => {
    if (!pillRef.current || !navRef.current) return;
    const idx = tabs.findIndex(t => t.key === tabKey);
    if (idx < 0) return;

    const navRect = navRectRef.current || navRef.current.getBoundingClientRect();
    const tabWidth = navRect.width / tabs.length;
    const pillWidth = Math.max(34, tabWidth - 10);
    const targetX = idx * tabWidth + (tabWidth - pillWidth) / 2;

    pillRef.current.style.transition = fast
      ? "transform 0.08s cubic-bezier(0.16, 1, 0.3, 1), width 0.08s ease"
      : "transform 0.32s cubic-bezier(0.18, 0.9, 0.2, 1), width 0.32s cubic-bezier(0.18, 0.9, 0.2, 1)";
    pillRef.current.style.transform = `translate3d(${targetX}px, 0, 0)`;
    pillRef.current.style.width = `${pillWidth}px`;
  }, []);

  // Update pill position on activeTab change
  useEffect(() => {
    if (!isScrubbingRef.current) {
      if (navRef.current) {
        const r = navRef.current.getBoundingClientRect();
        navRectRef.current = { left: r.left, width: r.width };
      }
      animatePillToTab(activeTab, false);
    }
  }, [activeTab, animatePillToTab]);

  // Window resize observer
  useEffect(() => {
    const updateRectAndPill = () => {
      if (navRef.current) {
        const r = navRef.current.getBoundingClientRect();
        navRectRef.current = { left: r.left, width: r.width };
        animatePillToTab(hoveredTabRef.current || activeTab, false);
      }
    };
    window.addEventListener("resize", updateRectAndPill);
    requestAnimationFrame(updateRectAndPill);
    return () => window.removeEventListener("resize", updateRectAndPill);
  }, [activeTab, animatePillToTab]);

  const handleSelect = useCallback((key: NavTab) => {
    if (activeTabRef.current !== key) {
      onTabChange(key);
      triggerHapticSelection();
    }
  }, [onTabChange, triggerHapticSelection]);

  // ── Unified Smooth Continuous Pointer Dragging (120fps Apple Liquid Glass) ──
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (navRef.current) {
      const r = navRef.current.getBoundingClientRect();
      navRectRef.current = { left: r.left, width: r.width };
    }
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    didDragRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const navLeft = navRectRef.current?.left ?? 0;
    const navWidth = navRectRef.current?.width ?? 390;
    const tabWidth = navWidth / tabs.length;
    const pillWidth = Math.max(34, tabWidth - 10);

    const fingerCenter = e.clientX - navLeft;
    const tabIndex = Math.min(tabs.length - 1, Math.max(0, Math.floor(fingerCenter / tabWidth)));
    const targetTab = tabs[tabIndex]?.key;

    if (targetTab) {
      hoveredTabRef.current = targetTab;
      setHoveredTab(targetTab);
      // Soft transition to initial touch point
      animatePillToTab(targetTab, true);
      triggerHapticImpact("light");
    }
  }, [animatePillToTab, triggerHapticImpact]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isScrubbingRef.current || !pillRef.current || !navRectRef.current) return;
    didDragRef.current = true;

    const navLeft = navRectRef.current.left;
    const navWidth = navRectRef.current.width;
    const tabWidth = navWidth / tabs.length;
    const pillWidth = Math.max(34, tabWidth - 10);

    // Continuous 1:1 finger tracking without snapping jumps!
    const fingerCenter = e.clientX - navLeft;
    const rawPillX = fingerCenter - pillWidth / 2;
    const clampedPillX = Math.max(4, Math.min(navWidth - pillWidth - 4, rawPillX));

    // Zero-delay direct GPU transform
    pillRef.current.style.transition = "none";
    pillRef.current.style.transform = `translate3d(${clampedPillX}px, 0, 0)`;

    // Softly detect which tab icon should illuminate
    const tabIndex = Math.min(tabs.length - 1, Math.max(0, Math.floor((clampedPillX + pillWidth / 2) / tabWidth)));
    const currentCandidate = tabs[tabIndex]?.key;

    if (currentCandidate && currentCandidate !== hoveredTabRef.current) {
      hoveredTabRef.current = currentCandidate;
      setHoveredTab(currentCandidate);
      triggerHapticSelection();
    }
  }, [triggerHapticSelection]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setIsScrubbing(false);

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      const destinationTab = hoveredTabRef.current || activeTabRef.current;
      hoveredTabRef.current = null;
      setHoveredTab(null);

      // Smoothly spring into the final tab position!
      animatePillToTab(destinationTab, false);

      if (destinationTab !== activeTabRef.current) {
        onTabChange(destinationTab);
        triggerHapticImpact("medium");
      }
    }
  }, [onTabChange, triggerHapticImpact, animatePillToTab]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    handlePointerUp(e);
  }, [handlePointerUp]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[430px] px-3.5 pb-3 pointer-events-auto">
        <nav
          ref={navRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            touchAction: "none",
            contain: "layout style paint",
            transform: "translateZ(0)",
          }}
          className={`
            relative w-full h-[66px] rounded-[28px] px-1 flex items-center justify-between
            select-none cursor-pointer
            ${
              isDark
                ? "bg-[#0b0c11]/85 border border-white/[0.12] text-white shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_0.5px_0_rgba(255,255,255,0.12)]"
                : "bg-white/85 border border-black/[0.08] text-[#1C1C1E] shadow-[0_12px_40px_rgba(0,0,0,0.09),inset_0_0.5px_0_rgba(255,255,255,0.8)]"
            }
            backdrop-blur-[45px] backdrop-saturate-[200%]
            transition-colors duration-200
          `}
        >
          {/* True Liquid Glass Pill Indicator */}
          <div
            ref={pillRef}
            className={`
              absolute top-[6px] h-[54px] rounded-[22px] pointer-events-none
              ${
                isDark
                  ? isScrubbing
                    ? "bg-white/[0.18] border border-white/[0.25] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.5)] scale-y-[1.03]"
                    : "bg-white/[0.12] border border-white/[0.16] shadow-[0_2px_14px_rgba(0,0,0,0.25),inset_0_0.5px_0.5px_rgba(255,255,255,0.3)]"
                  : isScrubbing
                    ? "bg-black/[0.09] border border-black/[0.10] shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.8)] scale-y-[1.03]"
                    : "bg-black/[0.05] border border-black/[0.06] shadow-sm"
              }
              backdrop-blur-3xl
            `}
            style={{ willChange: "transform, width", backfaceVisibility: "hidden" }}
          >
            {/* Specular Liquid Edge Sheen */}
            <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full opacity-75" />
          </div>

          {tabs.map((tab) => {
            const currentTab = isScrubbing && hoveredTab ? hoveredTab : activeTab;
            const isActive = currentTab === tab.key;
            const Icon = tab.icon;
            const badgeCount = tab.key === "bookings" ? bookingsCount : 0;
            const label = lang === "RU" ? tab.labelRU : tab.labelUZ;

            return (
              <div
                key={tab.key}
                onClick={() => {
                  if (!didDragRef.current) {
                    handleSelect(tab.key);
                  }
                }}
                className={`
                  relative flex-1 h-[54px] rounded-[22px] flex flex-col items-center justify-center
                  outline-none cursor-pointer select-none
                  ${isActive ? "font-bold" : "font-medium opacity-65 hover:opacity-90"}
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? isDark
                          ? "text-[#2997FF] drop-shadow-[0_2px_10px_rgba(41,151,255,0.45)] scale-105"
                          : "text-[#0071E3] drop-shadow-[0_2px_8px_rgba(0,113,227,0.3)] scale-105"
                        : isDark
                          ? "text-white/80"
                          : "text-[#1C1C1E]/80"
                    }
                    style={{ transition: "color 0.15s ease, transform 0.15s ease" }}
                  />

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-blue-500/30 border border-white/25 animate-in zoom-in duration-150">
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
                          ? "text-white font-bold"
                          : "text-[#1C1C1E] font-bold"
                        : isDark
                          ? "text-white/50"
                          : "text-[#1C1C1E]/50"
                    }
                  `}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default React.memo(BottomNavBar);
