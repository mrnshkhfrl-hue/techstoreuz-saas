"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react";

type AdminAIParserProps = {
  shopId: string;
};

type ParsedDraft = {
  title: string;
  batteryHealth: number;
  region: string;
  hasBox: boolean;
  defects: string;
  price: number;
};

const DEMO_POST_EXAMPLE = `Продам iPhone 15 Pro 256GB Natural Titanium
Состояние супер, АКБ 94%
Регион LL/A (США)
В комплекте родная коробка и кабель
Без ремонтных работ и дефектов
Цена: $890`;

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminAIParser({ shopId }: AdminAIParserProps) {
  const router = useRouter();

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);

  /* ── 1. AI Parse Handler ── */
  async function handleParse() {
    if (!text.trim()) {
      alert("Вставьте текст объявления из Telegram для распознавания");
      return;
    }

    setIsLoading(true);
    setDraft(null);
    setSuccessBanner(false);

    try {
      const res = await fetch("/api/admin/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (res.ok && data) {
        setDraft({
          title: data.title || "iPhone 15 Pro",
          batteryHealth: Number(data.batteryHealth) || 90,
          region: data.region || "LL/A",
          hasBox: Boolean(data.hasBox),
          defects: data.defects || "",
          price: Number(data.price) || 0,
        });
      } else {
        alert(data.error || "Ошибка распознавания текста");
      }
    } catch (err: any) {
      console.error("AI Parse error:", err);
      alert("Ошибка сети при попытке распознавания");
    } finally {
      setIsLoading(false);
    }
  }

  /* ── 2. Approve Draft & Publish Product ── */
  async function handleApprove() {
    if (!draft) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/admin/products/used", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId,
          title: draft.title,
          batteryHealth: draft.batteryHealth,
          region: draft.region,
          hasBox: draft.hasBox,
          defects: draft.defects,
          price: draft.price,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDraft(null);
        setText("");
        setSuccessBanner(true);
        router.refresh();

        setTimeout(() => {
          setSuccessBanner(false);
        }, 4000);
      } else {
        alert(data.error || "Ошибка при публикации товара");
      }
    } catch (err: any) {
      console.error("Error approving draft:", err);
      alert("Ошибка при сохранении Б/У товара");
    } finally {
      setIsPublishing(false);
    }
  }

  /* ── 3. Reject Draft ── */
  function handleReject() {
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="w-10 h-10 rounded-glass-btn bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
            ИИ-Парсер объявлений
          </h2>
          <p className="text-[11px] text-white/30">
            Вставьте пост из Telegram — нейросеть извлечёт все характеристики
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-glass bg-[#34C759]/15 border border-[#34C759]/25 text-[#34C759] flex items-center gap-3 backdrop-blur-2xl"
        >
          <CheckCircle2 size={22} className="text-[#34C759] flex-shrink-0" />
          <div>
            <p className="text-[14px] font-bold text-white">Опубликовано!</p>
            <p className="text-[11px] text-[#34C759]/80">
              Распознанный Б/У товар автоматически добавлен в каталог магазина
            </p>
          </div>
        </motion.div>
      )}

      {/* Input Group: Textarea & Scan Button */}
      <div className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-[#007AFF]" />
            Текст поста из Telegram
          </label>
          <button
            type="button"
            onClick={() => setText(DEMO_POST_EXAMPLE)}
            className="text-[10px] font-bold text-[#007AFF] hover:text-[#0A84FF] transition-colors cursor-pointer"
          >
            Вставить пример
          </button>
        </div>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вставьте пост с описанием смартфона (например: iPhone 15 Pro 256GB, АКБ 94%, регион LL/A, коробка есть, цена 890$)"
          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.03] transition-all resize-none"
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={tapSpring}
          disabled={isLoading || !text.trim()}
          onClick={handleParse}
          className={`
            w-full py-4 rounded-glass-btn text-[14px] font-bold transition-all
            ${
              isLoading || !text.trim()
                ? "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
                : "btn-system-blue"
            }
          `}
        >
          {isLoading ? "Распознавание..." : "Начать распознавание"}
        </motion.button>
      </div>

      {/* Review Draft Section */}
      {draft && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tapSpring}
          className="p-4 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <div className="w-8 h-8 rounded-full bg-[#34C759]/15 border border-[#34C759]/25 flex items-center justify-center text-[#34C759]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white leading-tight">
                Результат ИИ
              </h3>
              <p className="text-[11px] text-white/30">
                Проверьте характеристики перед публикацией
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1 bg-white/[0.02] p-3 rounded-glass-sm border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Модель
              </p>
              <p className="text-[13px] font-bold text-white truncate">
                {draft.title}
              </p>
            </div>
            <div className="space-y-1 bg-white/[0.02] p-3 rounded-glass-sm border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Цена
              </p>
              <p className="text-[13px] font-black text-[#007AFF]">
                ${draft.price}
              </p>
            </div>
            <div className="space-y-1 bg-white/[0.02] p-3 rounded-glass-sm border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                АКБ
              </p>
              <p className="text-[13px] font-bold text-white">
                {draft.batteryHealth}%
              </p>
            </div>
            <div className="space-y-1 bg-white/[0.02] p-3 rounded-glass-sm border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Регион
              </p>
              <p className="text-[13px] font-bold text-white">
                {draft.region}
              </p>
            </div>
            <div className="col-span-2 space-y-1 bg-white/[0.02] p-3 rounded-glass-sm border border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Комплект / Дефекты
              </p>
              <p className="text-[13px] font-medium text-white/80">
                {draft.hasBox ? "С коробкой." : "Без коробки."} {draft.defects}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={tapSpring}
              disabled={isPublishing}
              onClick={handleApprove}
              className={`
                py-3.5 rounded-glass-btn text-[13px] font-bold transition-all
                ${
                  isPublishing
                    ? "bg-[#34C759]/10 text-[#34C759]/40 border border-[#34C759]/15 cursor-not-allowed"
                    : "bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30 hover:bg-[#34C759]/30 cursor-pointer"
                }
              `}
            >
              {isPublishing ? "Сохранение..." : "Опубликовать"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={tapSpring}
              disabled={isPublishing}
              onClick={handleReject}
              className="py-3.5 rounded-glass-btn bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30 hover:bg-[#FF3B30]/30 text-[13px] font-bold cursor-pointer"
            >
              Отменить
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
