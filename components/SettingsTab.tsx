"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Globe,
  Sun,
  Moon,
  Laptop,
  Copy,
  Check,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sliders,
  Shield,
} from "lucide-react";
import { DbUser } from "@/hooks/useTelegramAuth";
import { TelegramWebAppUser } from "@/hooks/useTelegram";

interface SettingsTabProps {
  user: DbUser | null;
  telegramUser: TelegramWebAppUser | null;
  isDark: boolean;
  lang: "RU" | "UZ";
  onLangChange: (lang: "RU" | "UZ") => void;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  currentTheme: string;
  onNameUpdate: (newName: string) => Promise<boolean>;
  onShowToast: (message: string, type: "success" | "error") => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function SettingsTab({
  user,
  telegramUser,
  isDark,
  lang,
  onLangChange,
  onThemeChange,
  currentTheme,
  onNameUpdate,
  onShowToast,
}: SettingsTabProps) {
  const currentTgId = user?.telegramId || (telegramUser?.telegramId ? String(telegramUser.telegramId) : "");
  const adminIds = [
    process.env.NEXT_PUBLIC_ADMIN_IDS,
    process.env.NEXT_PUBLIC_SUPERADMIN_IDS,
    "8603067434",
    "7949519588",
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isAdmin = Boolean(currentTgId && adminIds.includes(String(currentTgId)));
  const superAdminIds = (process.env.NEXT_PUBLIC_SUPERADMIN_IDS || "7949519588")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isSuperAdmin = Boolean(currentTgId && superAdminIds.includes(String(currentTgId)));

  const [nameInput, setNameInput] = useState(user?.name || telegramUser?.firstName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [cooldownDaysLeft, setCooldownDaysLeft] = useState<number | null>(null);

  // Check 7-day name change restriction
  useEffect(() => {
    if (!currentTgId) return;
    const lastChangeKey = `last_name_change_${currentTgId}`;
    const lastChange = localStorage.getItem(lastChangeKey);
    if (lastChange) {
      const diff = Date.now() - Number(lastChange);
      if (diff < SEVEN_DAYS_MS) {
        const daysLeft = Math.ceil((SEVEN_DAYS_MS - diff) / (24 * 60 * 60 * 1000));
        setCooldownDaysLeft(daysLeft);
      } else {
        setCooldownDaysLeft(null);
      }
    }
  }, [currentTgId]);

  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    } else if (telegramUser?.firstName) {
      setNameInput(telegramUser.firstName);
    }
  }, [user?.name, telegramUser?.firstName]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    if (cooldownDaysLeft !== null) {
      onShowToast(
        lang === "RU"
          ? `Имя можно менять раз в 7 дней. Осталось дней: ${cooldownDaysLeft}`
          : `Ismni 7 kunda 1 marta o'zgartirish mumkin. Qolgan kunlar: ${cooldownDaysLeft}`,
        "error"
      );
      return;
    }

    setIsSavingName(true);
    try {
      const ok = await onNameUpdate(nameInput.trim());
      if (ok) {
        if (currentTgId) {
          localStorage.setItem(`last_name_change_${currentTgId}`, String(Date.now()));
          setCooldownDaysLeft(7);
        }
        onShowToast(
          lang === "RU" ? "Имя успешно обновлено!" : "Ism muvaffaqiyatli yangilandi!",
          "success"
        );
      } else {
        onShowToast(
          lang === "RU" ? "Не удалось обновить имя" : "Ismni yangilab bo'lmadi",
          "error"
        );
      }
    } catch {
      onShowToast(
        lang === "RU" ? "Ошибка сети" : "Tarmoq xatosi",
        "error"
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const copyId = () => {
    if (!currentTgId) return;
    navigator.clipboard.writeText(currentTgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    onShowToast(
      lang === "RU" ? "ID скопирован в буфер обмена" : "ID nusxalandi",
      "success"
    );
  };

  const d = isDark;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Title */}
      <div className="px-1">
        <h2 className={`text-[20px] font-bold tracking-tight ${d ? "text-white" : "text-[#1C1C1E]"}`}>
          {lang === "RU" ? "Настройки" : "Sozlamalar"}
        </h2>
        <p className={`text-[12px] ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`}>
          {lang === "RU"
            ? "Управление профилем, языком и темами приложения"
            : "Profil, til va mavzularni boshqarish"}
        </p>
      </div>

      {/* ── ADMIN ACCESS SECTION (Visible only to authorized store admins) ── */}
      {isAdmin && (
        <div
          className={`p-4 rounded-[22px] ${
            d
              ? "bg-gradient-to-br from-[#007AFF]/20 via-[#5856D6]/15 to-transparent border-[#007AFF]/30"
              : "bg-gradient-to-br from-[#007AFF]/10 via-[#5856D6]/10 to-transparent border-[#007AFF]/20"
          } border backdrop-blur-xl space-y-3 shadow-lg shadow-[#007AFF]/10`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#007AFF]" />
              <span className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                {lang === "RU" ? "Управление магазином" : "Do'kon boshqaruvi"}
              </span>
            </div>
            <span className="text-[10px] bg-[#007AFF]/20 text-[#007AFF] font-bold px-2 py-0.5 rounded-full border border-[#007AFF]/30 uppercase">
              Admin
            </span>
          </div>

          <div className={`grid ${isSuperAdmin ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-2`}>
            <a
              href={`/admin?adminId=${currentTgId}`}
              className="py-2.5 px-3 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#007AFF]/20 cursor-pointer"
            >
              <Sliders size={14} />
              <span>{lang === "RU" ? "Панель управления магазином" : "Do'kon boshqaruv paneli"}</span>
            </a>

            {isSuperAdmin && (
              <a
                href="/superadmin"
                className={`py-2.5 px-3 rounded-xl ${
                  d ? "bg-white/10 hover:bg-white/15 text-white" : "bg-black/5 hover:bg-black/10 text-[#1C1C1E]"
                } text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
              >
                <Shield size={14} className="text-[#AF52DE]" />
                <span>{lang === "RU" ? "Супер-Админ (Все магазины)" : "Super-Admin (Barcha do'konlar)"}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── 1. CHANGE NAME ── */}
      <div
        className={`p-4 rounded-[22px] ${
          d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"
        } border backdrop-blur-xl space-y-3`}
      >
        <div className="flex items-center gap-2">
          <User size={16} className="text-[#007AFF]" />
          <span className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
            {lang === "RU" ? "Имя пользователя" : "Foydalanuvchi ismi"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={cooldownDaysLeft !== null}
            placeholder={lang === "RU" ? "Введите ваше имя" : "Ismingizni kiriting"}
            className={`
              flex-1 px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all
              ${
                d
                  ? "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#007AFF]"
                  : "bg-black/[0.03] border border-black/10 text-[#1C1C1E] placeholder-black/30 focus:border-[#007AFF]"
              }
              ${cooldownDaysLeft !== null ? "opacity-60 cursor-not-allowed" : ""}
            `}
          />
          <button
            onClick={handleSaveName}
            disabled={isSavingName || cooldownDaysLeft !== null || !nameInput.trim()}
            className={`
              px-4 py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center transition-all
              ${
                cooldownDaysLeft !== null
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-md shadow-[#007AFF]/25 cursor-pointer"
              }
            `}
          >
            {isSavingName ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{lang === "RU" ? "Сохранить" : "Saqlash"}</span>
            )}
          </button>
        </div>

        {cooldownDaysLeft !== null ? (
          <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 font-medium">
            <Clock size={12} />
            {lang === "RU"
              ? `Смена имени доступна через ${cooldownDaysLeft} дн. (раз в 7 дней)`
              : `Ismni o'zgartirish ${cooldownDaysLeft} kundan keyin mumkin (7 kunda 1 marta)`}
          </p>
        ) : (
          <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
            {lang === "RU"
              ? "Имя можно менять не чаще 1 раза в 7 дней"
              : "Ismni har 7 kunda ko'pi bilan 1 marta o'zgartirish mumkin"}
          </p>
        )}
      </div>

      {/* ── 2. LANGUAGE ── */}
      <div
        className={`p-4 rounded-[22px] ${
          d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"
        } border backdrop-blur-xl space-y-3`}
      >
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-[#34C759]" />
          <span className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
            {lang === "RU" ? "Язык интерфейса" : "Ilova tili"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLangChange("RU")}
            className={`
              py-2.5 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${
                lang === "RU"
                  ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/20"
                  : d
                  ? "bg-white/5 text-white/70 hover:bg-white/10"
                  : "bg-black/[0.04] text-[#1C1C1E]/70 hover:bg-black/[0.08]"
              }
            `}
          >
            <span>🇷🇺 Русский</span>
            {lang === "RU" && <Check size={14} />}
          </button>

          <button
            onClick={() => onLangChange("UZ")}
            className={`
              py-2.5 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${
                lang === "UZ"
                  ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/20"
                  : d
                  ? "bg-white/5 text-white/70 hover:bg-white/10"
                  : "bg-black/[0.04] text-[#1C1C1E]/70 hover:bg-black/[0.08]"
              }
            `}
          >
            <span>🇺🇿 O'zbekcha</span>
            {lang === "UZ" && <Check size={14} />}
          </button>
        </div>
      </div>

      {/* ── 3. THEME SELECTION ── */}
      <div
        className={`p-4 rounded-[22px] ${
          d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"
        } border backdrop-blur-xl space-y-3`}
      >
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-[#FF9500]" />
          <span className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
            {lang === "RU" ? "Тема оформления" : "Mavzu"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onThemeChange("light")}
            className={`
              py-2.5 px-2 rounded-xl text-[12px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
              ${
                currentTheme === "light"
                  ? "bg-[#007AFF] text-white shadow-md"
                  : d
                  ? "bg-white/5 text-white/70 hover:bg-white/10"
                  : "bg-black/[0.04] text-[#1C1C1E]/70 hover:bg-black/[0.08]"
              }
            `}
          >
            <Sun size={15} />
            <span>{lang === "RU" ? "Светлая" : "Yorug'"}</span>
          </button>

          <button
            onClick={() => onThemeChange("dark")}
            className={`
              py-2.5 px-2 rounded-xl text-[12px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
              ${
                currentTheme === "dark"
                  ? "bg-[#007AFF] text-white shadow-md"
                  : d
                  ? "bg-white/5 text-white/70 hover:bg-white/10"
                  : "bg-black/[0.04] text-[#1C1C1E]/70 hover:bg-black/[0.08]"
              }
            `}
          >
            <Moon size={15} />
            <span>{lang === "RU" ? "Тёмная" : "Qorong'i"}</span>
          </button>

          <button
            onClick={() => onThemeChange("system")}
            className={`
              py-2.5 px-2 rounded-xl text-[12px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
              ${
                currentTheme === "system"
                  ? "bg-[#007AFF] text-white shadow-md"
                  : d
                  ? "bg-white/5 text-white/70 hover:bg-white/10"
                  : "bg-black/[0.04] text-[#1C1C1E]/70 hover:bg-black/[0.08]"
              }
            `}
          >
            <Laptop size={15} />
            <span>{lang === "RU" ? "Системная" : "Tizim"}</span>
          </button>
        </div>
      </div>

      {/* ── 4. TELEGRAM ID CARD ── */}
      <div
        className={`p-4 rounded-[22px] ${
          d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"
        } border backdrop-blur-xl flex items-center justify-between`}
      >
        <div className="space-y-0.5">
          <span className={`text-[11px] uppercase tracking-wider font-bold ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
            Telegram ID
          </span>
          <p className={`text-[15px] font-mono font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
            {currentTgId || "Не определен"}
          </p>
        </div>

        {currentTgId && (
          <button
            onClick={copyId}
            className={`
              p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer
              ${
                d
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  : "bg-black/5 hover:bg-black/10 border-black/10 text-[#1C1C1E]"
              }
            `}
          >
            {copiedId ? <Check size={16} className="text-[#34C759]" /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {/* ── 5. STORE BRANCHES DIRECTORY ── */}
      <div
        className={`p-4 rounded-[22px] ${
          d ? "bg-white/[0.04] border-white/10" : "bg-white border-black/10 shadow-sm"
        } border backdrop-blur-xl space-y-3.5`}
      >
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#FF2D55]" />
          <span className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
            {lang === "RU" ? "Филиалы магазина" : "Do'kon filiallari"}
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Branch 1 */}
          <div className={`p-3.5 rounded-xl ${d ? "bg-white/5 border-white/5" : "bg-black/[0.02] border-black/5"} border space-y-2`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                {lang === "RU" ? "Филиал №1 (Главный)" : "1-filial (Bosh)"}
              </h4>
              <span className="text-[10px] bg-[#34C759]/15 text-[#34C759] font-bold px-2 py-0.5 rounded-full border border-[#34C759]/25">
                09:00 - 21:00
              </span>
            </div>
            <p className={`text-[12px] ${d ? "text-white/60" : "text-[#1C1C1E]/60"} flex items-start gap-1.5`}>
              <MapPin size={13} className="shrink-0 mt-0.5 text-[#FF2D55]" />
              <span>{lang === "RU" ? "г. Самарканд, ул. Гульабад, 1" : "Samarqand sh., Gulobod ko'chasi, 1"}</span>
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="tel:+998772859999"
                className="inline-flex items-center gap-1 text-[12px] text-[#007AFF] font-bold"
              >
                <Phone size={12} />
                <span>+998 77 285-99-99</span>
              </a>
              <a
                href="https://yandex.uz/maps/?text=Самарканд+улица+Гульабад+1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white underline"
              >
                <ExternalLink size={10} />
                <span>{lang === "RU" ? "На карте" : "Xaritada"}</span>
              </a>
            </div>
          </div>

          {/* Branch 2 */}
          <div className={`p-3.5 rounded-xl ${d ? "bg-white/5 border-white/5" : "bg-black/[0.02] border-black/5"} border space-y-2`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-[13px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                {lang === "RU" ? "Филиал №2 (ТЦ «Makon Mall»)" : "2-filial («Makon Mall» SM)"}
              </h4>
              <span className="text-[10px] bg-[#34C759]/15 text-[#34C759] font-bold px-2 py-0.5 rounded-full border border-[#34C759]/25">
                10:00 - 22:00
              </span>
            </div>
            <p className={`text-[12px] ${d ? "text-white/60" : "text-[#1C1C1E]/60"} flex items-start gap-1.5`}>
              <MapPin size={13} className="shrink-0 mt-0.5 text-[#FF2D55]" />
              <span>{lang === "RU" ? "г. Самарканд, ТЦ «Makon Mall», 1-й этаж" : "Samarqand sh., «Makon Mall» SM, 1-qavat"}</span>
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="tel:+998772859999"
                className="inline-flex items-center gap-1 text-[12px] text-[#007AFF] font-bold"
              >
                <Phone size={12} />
                <span>+998 77 285-99-99</span>
              </a>
              <a
                href="https://yandex.uz/maps/?text=Самарканд+Makon+Mall"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white underline"
              >
                <ExternalLink size={10} />
                <span>{lang === "RU" ? "На карте" : "Xaritada"}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
