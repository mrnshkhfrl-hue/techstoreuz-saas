"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, ArrowRight, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";
import { TelegramWebAppUser } from "@/hooks/useTelegram";

interface OnboardingModalProps {
  isOpen: boolean;
  telegramUser: TelegramWebAppUser | null;
  onRegister: (phone: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

export default function OnboardingModal({
  isOpen,
  telegramUser,
  onRegister,
  onSuccess,
}: OnboardingModalProps) {
  const { haptic, isTelegram } = useTelegram();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showManualInput, setShowManualInput] = useState(!isTelegram);

  // If outside Telegram, default to manual input immediately
  useEffect(() => {
    if (!isTelegram) {
      setShowManualInput(true);
    }
  }, [isTelegram]);

  if (!isOpen) return null;

  const firstName = telegramUser?.firstName || "Гость";

  // Format the digits into +998 (XX) XXX-XX-XX
  const formatPhoneNumber = (input: string) => {
    // Keep only digits
    const cleaned = input.replace(/\D/g, "");
    // Strip leading 998 if entered
    let raw = cleaned;
    if (raw.startsWith("998")) {
      raw = raw.slice(3);
    }
    // Limit to 9 digits (Uzbek mobile length)
    raw = raw.slice(0, 9);
    setPhoneDigits(raw);

    // Format for display
    let formatted = "+998";
    if (raw.length > 0) formatted += ` (${raw.slice(0, 2)}`;
    if (raw.length >= 2) formatted += `) ${raw.slice(2, 5)}`;
    if (raw.length >= 5) formatted += `-${raw.slice(5, 7)}`;
    if (raw.length >= 7) formatted += `-${raw.slice(7, 9)}`;
    return formatted;
  };

  const displayPhone = () => {
    let formatted = "+998";
    if (phoneDigits.length > 0) formatted += ` (${phoneDigits.slice(0, 2)}`;
    if (phoneDigits.length >= 2) formatted += `) ${phoneDigits.slice(2, 5)}`;
    if (phoneDigits.length >= 5) formatted += `-${phoneDigits.slice(5, 7)}`;
    if (phoneDigits.length >= 7) formatted += `-${phoneDigits.slice(7, 9)}`;
    return formatted;
  };

  async function handleComplete(finalPhone: string) {
    if (!finalPhone || finalPhone.replace(/\D/g, "").length < 9) {
      setErrorMessage("Пожалуйста, введите полный номер телефона");
      haptic.notificationOccurred("error");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await onRegister(finalPhone);
      if (result.success) {
        haptic.notificationOccurred("success");
        onSuccess();
      } else {
        setErrorMessage(result.error || "Не удалось сохранить номер. Попробуйте еще раз.");
        haptic.notificationOccurred("error");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ошибка подключения к серверу");
      haptic.notificationOccurred("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Native Telegram Contact Sharing ──
  function handleRequestTelegramContact() {
    haptic.impactOccurred("medium");
    setErrorMessage("");

    const webApp = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;

    if (webApp && typeof webApp.requestContact === "function") {
      try {
        webApp.requestContact(async (granted: boolean, event: any) => {
          if (granted) {
            const rawPhone =
              event?.responseUnsafe?.contact?.phone_number ||
              event?.contact?.phone_number ||
              event?.response?.contact?.phone_number;

            if (rawPhone) {
              await handleComplete(rawPhone);
            } else {
              setShowManualInput(true);
            }
          } else {
            // User rejected or dismissed native prompt -> show manual input
            setShowManualInput(true);
          }
        });
      } catch (err) {
        console.warn("requestContact failed, opening manual input:", err);
        setShowManualInput(true);
      }
    } else {
      // Localhost or unsupported client -> reveal manual input with focus
      setShowManualInput(true);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phoneDigits.length < 9) {
      setErrorMessage("Введите 9 цифр номера телефона (например: 90 123-45-67)");
      haptic.notificationOccurred("warning");
      return;
    }
    const fullPhone = `+998${phoneDigits}`;
    handleComplete(fullPhone);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/10 p-6 text-center text-white backdrop-blur-2xl border border-white/20 shadow-2xl"
        >
          {/* Top highlight line for Liquid Glass */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

          {/* Ambient light orbs behind glass */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#007AFF]/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-[#7928CA]/25 blur-2xl pointer-events-none" />

          {/* Top Icon Badge */}
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] shadow-lg shadow-[#007AFF]/30">
            <Smartphone className="h-8 w-8 text-white stroke-[2.2]" />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#34C759] border-2 border-[#07070b]">
              <Sparkles className="h-3 w-3 text-white fill-white" />
            </div>
          </div>

          {/* Greeting */}
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            Добро пожаловать, {firstName}! 👋
          </h2>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-white/70 mb-6">
            Для оформления заказов и отслеживания статуса, пожалуйста, привяжите ваш номер телефона.
          </p>

          {/* Error notice */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-[#FF3B30]/20 border border-[#FF3B30]/30 px-3 py-2 text-xs text-[#FF8F89] backdrop-blur-sm"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* ── Native Telegram Contact Button ── */}
          <button
            type="button"
            onClick={handleRequestTelegramContact}
            disabled={isSubmitting}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#007AFF] via-[#0062E3] to-[#0051FF] px-4 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-[#007AFF]/25 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
            <Phone className="h-4 w-4 stroke-[2.5]" />
            <span>Поделиться контактом</span>
          </button>

          {/* Divider with option for manual input */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="h-[1px] w-full bg-white/10" />
            <span className="absolute bg-[#12121a]/80 px-2 text-[11px] uppercase tracking-wider text-white/40 backdrop-blur-md rounded-md">
              или вручную
            </span>
          </div>

          {/* ── Fallback Manual Input with +998 Mask ── */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                value={displayPhone()}
                onChange={(e) => formatPhoneNumber(e.target.value)}
                placeholder="+998 (__) ___-__-__"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3.5 text-center text-[16px] font-semibold tracking-wider text-white placeholder:text-white/30 backdrop-blur-md transition-all focus:border-[#007AFF] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneDigits.length < 9}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-[14px] font-medium text-white/90 backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Сохранение...</span>
                </div>
              ) : (
                <>
                  <span>Продолжить</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy footer guarantee */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" />
            <span>Безопасная авторизация через Supabase</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
