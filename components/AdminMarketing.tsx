"use client";

import { useState } from "react";
import {
  DollarSign,
  Megaphone,
  Share2,
  CheckCircle2,
  Save,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface AdminMarketingProps {
  shopId: string;
  initialRate: number;
  initialAboutText: string | null;
  initialTgLink: string | null;
  initialInstaLink: string | null;
  shopName: string;
}

export default function AdminMarketing({
  shopId,
  initialRate,
  initialAboutText,
  initialTgLink,
  initialInstaLink,
  shopName,
}: AdminMarketingProps) {
  const [currencyRate, setCurrencyRate] = useState(String(initialRate || 12800));
  const [aboutText, setAboutText] = useState(
    initialAboutText ||
      "🔥 Официальный магазин техники Apple в Самарканде. Trade-In, гарантия 1 год, рассрочка и доставка по всему Узбекистану!"
  );
  const [tgLink, setTgLink] = useState(initialTgLink || "https://t.me/prostoreuzb");
  const [instaLink, setInstaLink] = useState(initialInstaLink || "https://instagram.com/techbozor");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          currencyRate: Number(currencyRate),
          aboutText: aboutText.trim(),
          tgLink: tgLink.trim(),
          instaLink: instaLink.trim(),
        }),
      });

      if (!res.ok) throw new Error("Не удалось сохранить настройки");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const rateNum = Number(currencyRate) || 12800;

  return (
    <form onSubmit={handleSave} className="space-y-6 px-5 pb-12 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">
          Маркетинг и настройки витрины
        </h2>
        <p className="text-xs text-white/50">
          Управление курсом валют, рекламным баннером и контактами магазина
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/30 text-[#34C759] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Настройки успешно сохранены и обновлены в витрине!</span>
        </div>
      )}

      {/* ── 1. Currency Rate Section ── */}
      <div className="p-5 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/15 border border-[#34C759]/25 flex items-center justify-center text-[#34C759]">
            <DollarSign size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Курс валюты (USD → UZS)</h3>
            <p className="text-[11px] text-white/40">По этому курсу автоматически пересчитываются все цены в сумах</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              required
              value={currencyRate}
              onChange={(e) => setCurrencyRate(e.target.value)}
              placeholder="12800"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-base font-black text-white focus:outline-none focus:border-[#34C759]"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
              сум / $1 USD
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/60 space-y-1">
            <p className="flex justify-between">
              <span>Пример: $500</span>
              <b className="text-white">{(500 * rateNum).toLocaleString("ru-RU")} сум</b>
            </p>
            <p className="flex justify-between">
              <span>Пример: $1 000</span>
              <b className="text-white">{(1000 * rateNum).toLocaleString("ru-RU")} сум</b>
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Marketing Announcement Banner ── */}
      <div className="p-5 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF9500]/15 border border-[#FF9500]/25 flex items-center justify-center text-[#FF9500]">
            <Megaphone size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Рекламный баннер / Акция</h3>
            <p className="text-[11px] text-white/40">Отображается в профиле и информации о магазине</p>
          </div>
        </div>

        <div>
          <textarea
            rows={3}
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="Текст рекламной акции, гарантии или условий рассрочки..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white leading-relaxed focus:outline-none focus:border-[#FF9500]"
          />
        </div>
      </div>

      {/* ── 3. Contact & Social Links ── */}
      <div className="p-5 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
            <Share2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Каналы связи магазина</h3>
            <p className="text-[11px] text-white/40">Куда обращаются клиенты из витрины</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-1">
              Telegram поддержка / канал
            </label>
            <input
              type="text"
              value={tgLink}
              onChange={(e) => setTgLink(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-1">
              Instagram профиль
            </label>
            <input
              type="text"
              value={instaLink}
              onChange={(e) => setInstaLink(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/25 transition-all cursor-pointer disabled:opacity-50"
      >
        <Save size={16} />
        <span>{saving ? "Сохранение..." : "Сохранить изменения"}</span>
      </button>
    </form>
  );
}
