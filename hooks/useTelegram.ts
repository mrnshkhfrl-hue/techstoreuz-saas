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
  isPremium?: boolean;
}

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

export interface TelegramHaptic {
  impactOccurred: (style: HapticImpactStyle) => void;
  notificationOccurred: (type: HapticNotificationType) => void;
  selectionChanged: () => void;
}

export interface UseTelegramReturn {
  user: TelegramWebAppUser | null;
  isTelegram: boolean;
  isReady: boolean;
  webApp: any | null;
  haptic: TelegramHaptic;
  expand: () => void;
  ready: () => void;
  close: () => void;
  showBackButton: () => void;
  hideBackButton: () => void;
  onBackButtonClicked: (cb: () => void) => void;
  initData: string;
  colorScheme: 'light' | 'dark';
}

// ─── Mock data for local development ────────────────────────────────────────

const MOCK_USER: TelegramWebAppUser = {
  telegramId: 8603067434,
  firstName: 'Admin',
  username: 'admin',
  lastName: 'User',
  languageCode: 'ru',
  photoUrl: undefined,
  isPremium: true,
};

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

// ─── User Extraction Helpers ────────────────────────────────────────────────

function parseUserFromJson(str: string): TelegramWebAppUser | null {
  try {
    const raw = JSON.parse(decodeURIComponent(str));
    if (raw && (raw.id || raw.telegramId)) {
      return {
        telegramId: Number(raw.id || raw.telegramId),
        firstName: raw.first_name || raw.firstName || '',
        username: raw.username || '',
        lastName: raw.last_name || raw.lastName || '',
        languageCode: raw.language_code || raw.languageCode || 'ru',
        photoUrl: raw.photo_url || raw.photoUrl || undefined,
        isPremium: Boolean(raw.is_premium || raw.isPremium),
      };
    }
  } catch {}
  return null;
}

function parseUserFromQueryString(queryStr: string): TelegramWebAppUser | null {
  try {
    const cleanStr = queryStr.replace(/^[#?]/, '');
    const params = new URLSearchParams(cleanStr);
    const userParam = params.get('user');
    if (userParam) {
      return parseUserFromJson(userParam);
    }
    // Also check if entire param is tgWebAppData which itself contains user=...
    const tgWebAppData = params.get('tgWebAppData');
    if (tgWebAppData) {
      const nestedParams = new URLSearchParams(tgWebAppData);
      const nestedUser = nestedParams.get('user');
      if (nestedUser) {
        return parseUserFromJson(nestedUser);
      }
    }
  } catch {}
  return null;
}

export function extractTelegramUser(): TelegramWebAppUser | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Direct WebApp object initDataUnsafe.user
    const webApp = (window as any).Telegram?.WebApp;
    const directUser = webApp?.initDataUnsafe?.user;
    if (directUser && (directUser.id || directUser.telegramId)) {
      const u: TelegramWebAppUser = {
        telegramId: Number(directUser.id || directUser.telegramId),
        firstName: directUser.first_name || directUser.firstName || '',
        username: directUser.username || '',
        lastName: directUser.last_name || directUser.lastName || '',
        languageCode: directUser.language_code || directUser.languageCode || 'ru',
        photoUrl: directUser.photo_url || directUser.photoUrl || undefined,
        isPremium: Boolean(directUser.is_premium || directUser.isPremium),
      };
      sessionStorage.setItem('tg_shop_user', JSON.stringify(u));
      return u;
    }

    // 2. From webApp.initData string
    if (webApp?.initData) {
      const u = parseUserFromQueryString(webApp.initData);
      if (u) {
        sessionStorage.setItem('tg_shop_user', JSON.stringify(u));
        return u;
      }
    }

    // 3. From window.location.hash (#tgWebAppData=...)
    if (window.location.hash) {
      const u = parseUserFromQueryString(window.location.hash);
      if (u) {
        sessionStorage.setItem('tg_shop_user', JSON.stringify(u));
        return u;
      }
    }

    // 4. From window.location.search (?tgWebAppData=... or ?user=... or ?tgId=...)
    if (window.location.search) {
      const u = parseUserFromQueryString(window.location.search);
      if (u) {
        sessionStorage.setItem('tg_shop_user', JSON.stringify(u));
        return u;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const tgIdParam = searchParams.get('tgId') || searchParams.get('userId');
      if (tgIdParam && !isNaN(Number(tgIdParam))) {
        const directUser: TelegramWebAppUser = {
          telegramId: Number(tgIdParam),
          firstName: searchParams.get('name') || searchParams.get('firstName') || 'User',
          username: searchParams.get('username') || '',
          lastName: searchParams.get('lastName') || '',
          languageCode: 'ru',
          isPremium: false,
        };
        sessionStorage.setItem('tg_shop_user', JSON.stringify(directUser));
        return directUser;
      }
    }

    // 5. From sessionStorage cache
    const cached = sessionStorage.getItem('tg_shop_user');
    if (cached) {
      const u = JSON.parse(cached);
      if (u && u.telegramId) {
        return u;
      }
    }
  } catch (err) {
    console.error('[extractTelegramUser] Error:', err);
  }

  // 6. Localhost fallback
  if (isLocalhost()) {
    return MOCK_USER;
  }

  return null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<any | null>(null);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial sync check
    const initialUser = extractTelegramUser();
    if (initialUser) {
      setUser(initialUser);
    }

    const directTg = (window as any).Telegram?.WebApp;
    if (directTg) {
      setWebApp(directTg);
      try {
        directTg.ready();
        directTg.expand();
      } catch {}
    }

    // Polling loop for up to 3 seconds to catch async script initialization
    let attempts = 0;
    const maxAttempts = 30; // 30 x 100ms = 3.0s
    const timer = setInterval(() => {
      attempts++;
      const currentTg = (window as any).Telegram?.WebApp;
      if (currentTg && !webApp) {
        setWebApp(currentTg);
        try {
          currentTg.ready();
          currentTg.expand();
        } catch {}
      }

      const foundUser = extractTelegramUser();
      if (foundUser) {
        setUser(foundUser);
        setIsReady(true);
        clearInterval(timer);
        return;
      }

      if (attempts >= maxAttempts) {
        setIsReady(true);
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const rawTg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp || webApp : webApp;
  const isTelegram = Boolean(rawTg && (rawTg.initData || user));
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
