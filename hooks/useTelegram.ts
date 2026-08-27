'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TelegramWebAppUser {
  telegramId: number;
  firstName: string;
  username: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
}

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

export interface TelegramHaptic {
  /** Trigger impact haptic feedback */
  impactOccurred: (style: HapticImpactStyle) => void;
  /** Trigger notification haptic feedback */
  notificationOccurred: (type: HapticNotificationType) => void;
  /** Trigger selection change haptic feedback */
  selectionChanged: () => void;
}

export interface UseTelegramReturn {
  /** Current Telegram user data (mock on localhost) */
  user: TelegramWebAppUser | null;
  /** Whether WebApp is running inside Telegram */
  isTelegram: boolean;
  /** Whether the SDK has been initialized */
  isReady: boolean;
  /** Raw Telegram WebApp object (null outside Telegram) */
  webApp: WebApp | null;
  /** Haptic feedback methods (no-op outside Telegram) */
  haptic: TelegramHaptic;
  /** Expand the WebApp to full screen */
  expand: () => void;
  /** Signal that the UI is ready */
  ready: () => void;
  /** Close the WebApp */
  close: () => void;
  /** Show the native back button */
  showBackButton: () => void;
  /** Hide the native back button */
  hideBackButton: () => void;
  /** Set a callback for the native back button */
  onBackButtonClicked: (cb: () => void) => void;
  /** Raw initData string for backend validation */
  initData: string;
  /** Color scheme from Telegram ('light' | 'dark') */
  colorScheme: 'light' | 'dark';
}

// ─── WebApp type from @twa-dev/sdk ──────────────────────────────────────────

// We dynamically import @twa-dev/sdk only on the client.
// Define a minimal type alias so TS doesn't complain.
type WebApp = typeof import('@twa-dev/sdk').default;

// ─── Mock data for local development ────────────────────────────────────────

const MOCK_USER: TelegramWebAppUser = {
  telegramId: 123456789,
  firstName: 'Dev',
  username: 'dev_user',
  lastName: 'Mode',
  languageCode: 'en',
  photoUrl: undefined,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.')
  );
}

/**
 * No-op haptic — used as fallback outside Telegram.
 * Logs calls in development for debugging convenience.
 */
const noopHaptic: TelegramHaptic = {
  impactOccurred: (style) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Telegram Mock] haptic.impactOccurred("${style}")`);
    }
  },
  notificationOccurred: (type) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Telegram Mock] haptic.notificationOccurred("${type}")`);
    }
  },
  selectionChanged: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Telegram Mock] haptic.selectionChanged()');
    }
  },
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize SDK on mount (client-only)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import — only runs on client, tree-shakes on server
        const WebAppModule = await import('@twa-dev/sdk');
        const tg = WebAppModule.default;

        if (cancelled) return;

        // Check if we're actually inside Telegram
        // The SDK object exists, but initData will be empty outside Telegram
        if (tg && tg.initData) {
          setWebApp(tg);
        } else if (!isLocalhost()) {
          // Not Telegram, not localhost — still set the SDK for potential use
          console.warn('[useTelegram] WebApp SDK loaded but no initData. Running in fallback mode.');
        }
      } catch (err) {
        // SDK import failed (e.g., SSR or unsupported environment)
        console.warn('[useTelegram] @twa-dev/sdk import failed, using fallback:', err);
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived state ──

  const isTelegram = webApp !== null && !!webApp.initData;

  const user: TelegramWebAppUser | null = useMemo(() => {
    if (isTelegram && webApp) {
      const tgUser = webApp.initDataUnsafe?.user;
      if (tgUser) {
        return {
          telegramId: tgUser.id,
          firstName: tgUser.first_name,
          username: tgUser.username ?? '',
          lastName: tgUser.last_name,
          languageCode: tgUser.language_code,
          photoUrl: tgUser.photo_url,
        };
      }
    }
    // Fallback: return mock user on localhost, null otherwise
    if (isLocalhost()) {
      return MOCK_USER;
    }
    return null;
  }, [isTelegram, webApp]);

  const initData = isTelegram && webApp ? webApp.initData : '';

  const colorScheme: 'light' | 'dark' = useMemo(() => {
    if (isTelegram && webApp) {
      return webApp.colorScheme || 'light';
    }
    // Fallback: check system preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      return 'dark';
    }
    return 'light';
  }, [isTelegram, webApp]);

  // ── Haptic feedback ──

  const haptic: TelegramHaptic = useMemo(() => {
    if (isTelegram && webApp?.HapticFeedback) {
      return {
        impactOccurred: (style: HapticImpactStyle) => {
          webApp.HapticFeedback.impactOccurred(style);
        },
        notificationOccurred: (type: HapticNotificationType) => {
          webApp.HapticFeedback.notificationOccurred(type);
        },
        selectionChanged: () => {
          webApp.HapticFeedback.selectionChanged();
        },
      };
    }
    return noopHaptic;
  }, [isTelegram, webApp]);

  // ── Native methods ──

  const expand = useCallback(() => {
    if (isTelegram && webApp) {
      webApp.expand();
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Telegram Mock] expand()');
    }
  }, [isTelegram, webApp]);

  const ready = useCallback(() => {
    if (isTelegram && webApp) {
      webApp.ready();
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Telegram Mock] ready()');
    }
  }, [isTelegram, webApp]);

  const close = useCallback(() => {
    if (isTelegram && webApp) {
      webApp.close();
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Telegram Mock] close()');
    }
  }, [isTelegram, webApp]);

  const showBackButton = useCallback(() => {
    if (isTelegram && webApp) {
      webApp.BackButton.show();
    }
  }, [isTelegram, webApp]);

  const hideBackButton = useCallback(() => {
    if (isTelegram && webApp) {
      webApp.BackButton.hide();
    }
  }, [isTelegram, webApp]);

  const onBackButtonClicked = useCallback(
    (cb: () => void) => {
      if (isTelegram && webApp) {
        webApp.BackButton.onClick(cb);
      }
    },
    [isTelegram, webApp]
  );

  return {
    user,
    isTelegram,
    isReady,
    webApp,
    haptic,
    expand,
    ready,
    close,
    showBackButton,
    hideBackButton,
    onBackButtonClicked,
    initData,
    colorScheme,
  };
}
