'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram, TelegramWebAppUser } from '@/hooks/useTelegram';

export interface DbUser {
  id: string;
  telegramId: string;
  phone?: string | null;
  name?: string | null;
  address?: string | null;
  isPremium?: boolean;
  photoUrl?: string | null;
  username?: string | null;
  bookings?: any[];
  ownedShops?: any[];
  adminIn?: any[];
}

export interface UseTelegramAuthReturn {
  user: DbUser | null;
  telegramUser: TelegramWebAppUser | null;
  isLoading: boolean;
  needsPhone: boolean;
  error: string | null;
  registerWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
  phone: string | null;
}

export function useTelegramAuth(): UseTelegramAuthReturn {
  const tg = useTelegram();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  const checkUserExists = useCallback(async (tgUser: TelegramWebAppUser) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/auth/sync?telegramId=${encodeURIComponent(tgUser.telegramId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to verify user');
      }

      const data = await res.json();
      if (data.exists && data.user) {
        setDbUser({
          ...data.user,
          photoUrl: tgUser.photoUrl || data.user.photoUrl,
          username: tgUser.username || data.user.username,
        });
        setNeedsPhone(false);
      } else {
        // User not in DB or has no phone -> trigger Onboarding
        setDbUser(null);
        setNeedsPhone(true);
      }
    } catch (err: any) {
      console.error('[useTelegramAuth] Check error:', err);
      setError(err?.message || 'Authentication error');
      // On network error or DB missing, trigger onboarding for safety
      setNeedsPhone(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithPhone = useCallback(
    async (phone: string) => {
      if (!tg.user) {
        return { success: false, error: 'Telegram user not detected' };
      }

      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: tg.user.telegramId,
            firstName: tg.user.firstName,
            lastName: tg.user.lastName,
            username: tg.user.username,
            photoUrl: tg.user.photoUrl,
            phone: phone.trim(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to register phone');
        }

        const data = await res.json();
        if (data?.user) {
          setDbUser(data.user);
          setNeedsPhone(false);
          return { success: true };
        }
        return { success: false, error: 'Invalid response from server' };
      } catch (err: any) {
        console.error('[useTelegramAuth] Register error:', err);
        return { success: false, error: err.message || 'Registration error' };
      }
    },
    [tg.user]
  );

  useEffect(() => {
    if (tg.isReady) {
      if (tg.user) {
        if (!hasCheckedRef.current) {
          hasCheckedRef.current = true;
          checkUserExists(tg.user);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [tg.isReady, tg.user, checkUserExists]);

  const refetch = useCallback(async () => {
    if (tg.user) {
      await checkUserExists(tg.user);
    }
  }, [tg.user, checkUserExists]);

  return {
    user: dbUser,
    telegramUser: tg.user,
    isLoading,
    needsPhone,
    error,
    registerWithPhone,
    refetch,
    phone: dbUser?.phone || null,
  };
}
