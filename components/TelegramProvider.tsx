"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useTelegram, type UseTelegramReturn } from "@/hooks/useTelegram";

// ─── Context ────────────────────────────────────────────────────────────────

const TelegramContext = createContext<UseTelegramReturn | null>(null);

/**
 * Access Telegram WebApp data anywhere in the component tree.
 *
 * @example
 * ```tsx
 * const { user, haptic, isTelegram } = useTelegramContext();
 * ```
 */
export function useTelegramContext(): UseTelegramReturn {
  const ctx = useContext(TelegramContext);
  if (!ctx) {
    throw new Error(
      "useTelegramContext must be used within <TelegramProvider>"
    );
  }
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export default function TelegramProvider({
  children,
}: {
  children: ReactNode;
}) {
  const telegram = useTelegram();

  // Auto-expand to fullscreen & signal readiness once SDK is initialized
  useEffect(() => {
    if (!telegram.isReady) return;

    // expand() — open the Mini App in full-screen mode
    telegram.expand();

    // ready() — tell Telegram the UI is loaded (hides the native loader)
    telegram.ready();
  }, [telegram.isReady]);

  return (
    <TelegramContext.Provider value={telegram}>
      {children}
    </TelegramContext.Provider>
  );
}
