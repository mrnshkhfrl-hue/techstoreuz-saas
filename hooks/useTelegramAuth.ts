'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram, extractTelegramUser, TelegramWebAppUser } from '@/hooks/useTelegram';

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
  const checkedIdRef = useRef<string | null>(null);

  const activeTgUser = tg.user || extractTelegramUser();

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
      setNeedsPhone(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithPhone = useCallback(
    async (phone: string) => {
      const userToRegister = activeTgUser;
      if (!userToRegister) {
        return { success: false, error: 'Telegram user not detected' };
      }

      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: userToRegister.telegramId,
            firstName: userToRegister.firstName,
            lastName: userToRegister.lastName,
            username: userToRegister.username,
            photoUrl: userToRegister.photoUrl,
            phone: phone.trim(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to register phone');
        }

        const data = await res.json();
        if (data?.user) {
          setDbUser({
            ...data.user,
            photoUrl: userToRegister.photoUrl || data.user.photoUrl,
            username: userToRegister.username || data.user.username,
          });
          setNeedsPhone(false);
          return { success: true };
        }
        return { success: false, error: 'Invalid response from server' };
      } catch (err: any) {
        console.error('[useTelegramAuth] Register error:', err);
        return { success: false, error: err.message || 'Registration error' };
      }
    },
    [activeTgUser]
  );

  useEffect(() => {
    if (activeTgUser) {
      const idStr = String(activeTgUser.telegramId);
      if (checkedIdRef.current !== idStr) {
        checkedIdRef.current = idStr;
        checkUserExists(activeTgUser);
      }
    } else if (tg.isReady) {
      setIsLoading(false);
    }
  }, [activeTgUser, tg.isReady, checkUserExists]);

  const refetch = useCallback(async () => {
    if (activeTgUser) {
      await checkUserExists(activeTgUser);
    }
  }, [activeTgUser, checkUserExists]);

  return {
    user: dbUser,
    telegramUser: activeTgUser,
    isLoading,
    needsPhone,
    error,
    registerWithPhone,
    refetch,
    phone: dbUser?.phone || null,
  };
}
