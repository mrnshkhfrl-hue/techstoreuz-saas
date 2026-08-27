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
  webApp: any | null;
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

const noopHaptic: TelegramHaptic = {
  impactOccurred: () => {},
  notificationOccurred: () => {},
  selectionChanged: () => {},
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize SDK on mount (client-only)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (typeof window !== 'undefined') {
          const directTg = (window as any).Telegram?.WebApp;
          if (directTg) {
            directTg.ready();
            directTg.expand();
            if (!cancelled) setWebApp(directTg);
          }
        }

        const WebAppModule = await import('@twa-dev/sdk');
        const tg = WebAppModule.default;

        if (cancelled) return;

        if (tg) {
          try {
            tg.ready();
            tg.expand();
          } catch {}
          setWebApp(tg);
        }
      } catch (err) {
        console.warn('[useTelegram] SDK load fallback:', err);
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

  const rawTg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp || webApp : webApp;
  const tgUser = rawTg?.initDataUnsafe?.user;

  const isTelegram = Boolean(rawTg && (rawTg.initData || tgUser));

  const user: TelegramWebAppUser | null = useMemo(() => {
    if (tgUser && tgUser.id) {
      return {
        telegramId: Number(tgUser.id),
        firstName: tgUser.first_name || '',
        username: tgUser.username || '',
        lastName: tgUser.last_name || '',
        languageCode: tgUser.language_code || 'ru',
        photoUrl: tgUser.photo_url || undefined,
      };
    }
    // Fallback: return mock user on localhost, null otherwise
    if (isLocalhost()) {
      return MOCK_USER;
    }
    return null;
  }, [tgUser]);

  const initData = rawTg?.initData || '';

  const colorScheme: 'light' | 'dark' = useMemo(() => {
    if (rawTg?.colorScheme) {
      return rawTg.colorScheme;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      return 'dark';
    }
    return 'dark';
  }, [rawTg]);

  // ── Haptic feedback ──

  const haptic: TelegramHaptic = useMemo(() => {
    if (rawTg?.HapticFeedback) {
      return {
        impactOccurred: (style: HapticImpactStyle) => {
          try { rawTg.HapticFeedback.impactOccurred(style); } catch {}
        },
        notificationOccurred: (type: HapticNotificationType) => {
          try { rawTg.HapticFeedback.notificationOccurred(type); } catch {}
        },
        selectionChanged: () => {
          try { rawTg.HapticFeedback.selectionChanged(); } catch {}
        },
      };
    }
    return noopHaptic;
  }, [rawTg]);

  const expand = useCallback(() => {
    try { rawTg?.expand(); } catch {}
  }, [rawTg]);

  const ready = useCallback(() => {
    try { rawTg?.ready(); } catch {}
  }, [rawTg]);

  const close = useCallback(() => {
    try { rawTg?.close(); } catch {}
  }, [rawTg]);

  const showBackButton = useCallback(() => {
    try { rawTg?.BackButton?.show(); } catch {}
  }, [rawTg]);

  const hideBackButton = useCallback(() => {
    try { rawTg?.BackButton?.hide(); } catch {}
  }, [rawTg]);

  const onBackButtonClicked = useCallback(
    (cb: () => void) => {
      try { rawTg?.BackButton?.onClick(cb); } catch {}
    },
    [rawTg]
  );

  return {
    user,
    isTelegram,
    isReady,
    webApp: rawTg,
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
