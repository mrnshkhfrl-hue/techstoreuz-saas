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

      const cachedPhone = typeof window !== 'undefined' ? localStorage.getItem(`tg_phone_${tgUser.telegramId}`) : null;

      const res = await fetch(`/api/auth/sync?telegramId=${encodeURIComponent(tgUser.telegramId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to verify user');
      }

      const data = await res.json();
      if (data.exists && data.user && data.user.phone) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`tg_phone_${tgUser.telegramId}`, data.user.phone);
        }
        setDbUser({
          ...data.user,
          photoUrl: tgUser.photoUrl || data.user.photoUrl,
          username: tgUser.username || data.user.username,
        });
        setNeedsPhone(false);
      } else if (cachedPhone) {
        // User has verified phone on this device before -> auto-sync with server!
        try {
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: tgUser.telegramId,
              firstName: tgUser.firstName,
              lastName: tgUser.lastName,
              username: tgUser.username,
              photoUrl: tgUser.photoUrl,
              phone: cachedPhone,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData?.user) {
            setDbUser({
              ...syncData.user,
              photoUrl: tgUser.photoUrl || syncData.user.photoUrl,
              username: tgUser.username || syncData.user.username,
            });
            setNeedsPhone(false);
            return;
          }
        } catch {}
        setDbUser(null);
        setNeedsPhone(true);
      } else {
        // User not in DB or has no phone -> trigger Onboarding
        setDbUser(null);
        setNeedsPhone(true);
      }
    } catch (err: any) {
      console.error('[useTelegramAuth] Check error:', err);
      setError(err?.message || 'Authentication error');
      const cachedPhone = typeof window !== 'undefined' ? localStorage.getItem(`tg_phone_${tgUser.telegramId}`) : null;
      if (cachedPhone) {
        setNeedsPhone(false);
      }
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

      const trimmedPhone = phone.trim();

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
            phone: trimmedPhone,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to register phone');
        }

        const data = await res.json();
        if (data?.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`tg_phone_${userToRegister.telegramId}`, trimmedPhone);
          }
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
