"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";

interface TradeInBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  telegramId?: string | number;
}
const SIM_OPTIONS = [
  "1 SIM", "2 SIM", "1 SIM + 1 eSIM", "Only eSIM"
];

const BATTERY_OPTIONS = [
  "100%", "98-99%", "95-97%", "90-93%", 
  "86-89%", "83-85%", "80-82%", "75-78%", "70-74%"
];

const DEFECT_OPTIONS_RU = [
  "Нет дефектов",
  "Экран заменен",
  "Царапины на корпусе",
  "FaceID не работает",
  "Не работает динамик",
  "Сколы на экране",
  "Заменена батарея",
];

const DEFECT_OPTIONS_UZ = [
  "Kamchilik yo'q",
  "Ekran almashtirilgan",
  "Korpusda tirnalishlar",
  "FaceID ishlamaydi",
  "Dinamik ishlamaydi",
  "Ekranda tirnalishlar",
  "Batareya almashtirilgan",
];

const BOX_OPTIONS_RU = ["Есть коробка", "Нет коробки"];
const BOX_OPTIONS_UZ = ["Karobkasi bor", "Karobkasi yo'q"];

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export default function TradeInBottomSheet({ isOpen, onClose, lang = "ru", telegramId }: TradeInBottomSheetProps) {
  const [step, setStep] = useState<Step>(1);
  const [deviceModel, setDeviceModel] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [sim, setSim] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [defects, setDefects] = useState<string[]>([]);
  const [box, setBox] = useState("");
  
  const [deviceMap, setDeviceMap] = useState<Record<string, { storage: string[]; colors: string[] }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ estimatedPrice: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && !deviceMap) {
      fetch("/api/trade-in/meta")
        .then(res => res.json())
        .then(data => {
          if (data.success) setDeviceMap(data.deviceMap);
        })
        .catch(console.error);
    }
  }, [isOpen, deviceMap]);

  const DEVICE_MODELS = deviceMap ? Object.keys(deviceMap) : [];

  const isRu = lang === "ru";
  const defectOptions = isRu ? DEFECT_OPTIONS_RU : DEFECT_OPTIONS_UZ;
  const boxOptions = isRu ? BOX_OPTIONS_RU : BOX_OPTIONS_UZ;
  const noDefectLabel = defectOptions[0];

  const t = useMemo(() => ({
    title: isRu ? "Оценка Trade-In" : "Trade-In baholash",
    step1Title: isRu ? "Выберите модель" : "Modelni tanlang",
    step2Title: isRu ? "Объем памяти" : "Xotira hajmi",
    step3Title: isRu ? "Цвет устройства" : "Qurilma rangi",
    step4Title: isRu ? "Тип SIM-карты" : "SIM-karta turi",
    step5Title: isRu ? "Состояние аккумулятора" : "Batareya holati",
    step6Title: isRu ? "Дефекты устройства" : "Qurilma kamchiliklari",
    step6Hint: isRu ? "Выберите все, что применимо" : "Tegishli variantlarni tanlang",
    step7Title: isRu ? "Комплектация" : "Komplektatsiya",
    calculating: isRu ? "Оцениваем..." : "Baholanmoqda...",
    resultTitle: isRu ? "Предварительная оценка" : "Dastlabki baho",
    resultHint: isRu ? "Итоговая цена может измениться после диагностики" : "Yakuniy narx diagnostikadan keyin o'zgarishi mumkin",
    submitBtn: isRu ? "Оставить заявку" : "Ariza qoldirish",
    closeBtn: isRu ? "Закрыть" : "Yopish",
    nextBtn: isRu ? "Далее" : "Keyingi",
    backBtn: isRu ? "Назад" : "Orqaga",
    errorMsg: isRu ? "Ошибка оценки. Попробуйте снова." : "Baholashda xatolik. Qaytadan urinib ko'ring.",
  }), [isRu]);

  const resetForm = () => {
    setStep(1);
    setDeviceModel("");
    setStorage("");
    setColor("");
    setSim("");
    setBatteryHealth("");
    setDefects([]);
    setBox("");
    setResult(null);
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  const toggleDefect = (d: string) => {
    if (d === noDefectLabel) {
      setDefects(prev => prev.includes(noDefectLabel) ? [] : [noDefectLabel]);
      return;
    }
    setDefects(prev => {
      const without = prev.filter(x => x !== noDefectLabel);
      return without.includes(d) ? without.filter(x => x !== d) : [...without, d];
    });
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError("");
    try {
      const tgId = telegramId || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";
      
      // We append color, sim, and box to condition so they are saved in the DB without changing the Prisma schema right now
      const defectsStr = defects.includes(noDefectLabel) ? "" : defects.join(", ");
      const combinedCondition = [color, sim, box, defectsStr].filter(Boolean).join(", ");

      const res = await fetch("/api/trade-in/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: String(tgId),
          deviceModel,
          storage,
          batteryHealth,
          color,
          sim,
          box,
          condition: combinedCondition,
          defects: defectsStr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error");
      setResult({ estimatedPrice: data.tradeIn.estimatedPrice });
      setStep(8);
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const tgId = telegramId || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";
      const defectsStr = defects.includes(noDefectLabel) ? "" : defects.join(", ");
      const combinedCondition = [color, sim, box, defectsStr].filter(Boolean).join(", ");

      const res = await fetch("/api/trade-in/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: String(tgId),
          deviceModel,
          storage,
          batteryHealth,
          color,
          sim,
          box,
          condition: combinedCondition,
          estimatedPrice: result?.estimatedPrice || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error");
      
      alert(isRu ? "Заявка успешно отправлена" : "Ariza muvaffaqiyatli yuborildi");
      
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.close();
      } else {
        handleClose();
      }
    } catch {
      setError(isRu ? "Ошибка при отправке заявки. Попробуйте снова." : "Arizani yuborishda xatolik. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    1: t.step1Title,
    2: t.step2Title,
    3: t.step3Title,
    4: t.step4Title,
    5: t.step5Title,
    6: t.step6Title,
    7: t.step7Title,
    8: t.resultTitle,
  };

  const canProceed = (s: Step) => {
    if (s === 1) return !!deviceModel;
    if (s === 2) return !!storage;
    if (s === 3) return !!color;
    if (s === 4) return !!sim;
    if (s === 5) return !!batteryHealth;
    if (s === 6) return defects.length > 0;
    if (s === 7) return !!box;
    return false;
  };

  const OptionButton = ({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      onClick={onClick}
      className={`text-left px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-200 border flex items-center gap-3 ${
        selected
          ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
          : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 text-black/80 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/10"
      } ${className}`}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? "border-blue-500 bg-blue-500" : "border-black/20 dark:border-white/20"
      }`}>
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );

  const CheckboxButton = ({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-200 border ${
        checked
          ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
          : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 text-black/80 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/10"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? "border-blue-500 bg-blue-500" : "border-black/20 dark:border-white/20"
        }`}>
          {checked && (
            <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,5 4.5,8.5 11,1.5" />
            </svg>
          )}
        </span>
        {children}
      </span>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-[500px] max-h-[92vh] overflow-hidden rounded-t-[32px] shadow-2xl flex flex-col bg-white/90 dark:bg-black/60 backdrop-blur-3xl border-t border-white/40 dark:border-white/10"
          >
            {/* Drag Handle */}
            <div className="pt-5 pb-2 flex justify-center cursor-pointer" onClick={handleClose}>
              <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black dark:text-white">{t.title}</h2>
                {step < 8 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
                    {step}/7
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-1">
                {stepTitles[step]}
              </p>

              {/* Progress Bar */}
              {step < 8 && (
                <div className="mt-3 h-1 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    initial={false}
                    animate={{ width: `${(step / 7) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  {/* Step 1: Device Model */}
                  {step === 1 && (
                    !deviceMap ? (
                      [...Array(6)].map((_, i) => (
                        <div key={i} className="w-full h-[52px] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse border border-white/30 dark:border-white/10" />
                      ))
                    ) : (
                      DEVICE_MODELS.map(model => (
                        <OptionButton key={model} selected={deviceModel === model} onClick={() => setDeviceModel(model)} className="w-full">
                          {model}
                        </OptionButton>
                      ))
                    )
                  )}

                  {/* Step 2: Storage */}
                  {step === 2 && deviceMap && (deviceMap[deviceModel]?.storage || []).map(opt => (
                    <OptionButton key={opt} selected={storage === opt} onClick={() => setStorage(opt)} className="w-full">
                      {opt}
                    </OptionButton>
                  ))}

                  {/* Step 3: Color */}
                  {step === 3 && deviceMap && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {(deviceMap[deviceModel]?.colors || []).map(c => (
                        <OptionButton key={c} selected={color === c} onClick={() => setColor(c)}>
                          {c}
                        </OptionButton>
                      ))}
                    </div>
                  )}

                  {/* Step 4: SIM */}
                  {step === 4 && SIM_OPTIONS.map(s => (
                    <OptionButton key={s} selected={sim === s} onClick={() => setSim(s)} className="w-full">
                      {s}
                    </OptionButton>
                  ))}

                  {/* Step 5: Battery */}
                  {step === 5 && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {BATTERY_OPTIONS.map(opt => (
                        <OptionButton key={opt} selected={batteryHealth === opt} onClick={() => setBatteryHealth(opt)}>
                          {opt}
                        </OptionButton>
                      ))}
                    </div>
                  )}

                  {/* Step 6: Defects */}
                  {step === 6 && (
                    <>
                      <p className="text-xs text-black/40 dark:text-white/40 mb-1">{t.step6Hint}</p>
                      {defectOptions.map(d => (
                        <CheckboxButton key={d} checked={defects.includes(d)} onClick={() => toggleDefect(d)}>
                          {d}
                        </CheckboxButton>
                      ))}
                    </>
                  )}

                  {/* Step 7: Box */}
                  {step === 7 && boxOptions.map(b => (
                    <OptionButton key={b} selected={box === b} onClick={() => setBox(b)} className="w-full">
                      {b}
                    </OptionButton>
                  ))}

                  {/* Step 8: Result */}
                  {step === 8 && result && (
                    <div className="flex flex-col items-center text-center py-6 space-y-5">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-black/50 dark:text-white/50">{t.resultTitle}</p>
                        <p className="text-4xl font-black text-black dark:text-white mt-1">
                          ${result.estimatedPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="w-full bg-black/5 dark:bg-white/5 rounded-2xl p-4 space-y-2 text-left text-sm">
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "Модель" : "Model"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{deviceModel}</span></div>
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "Память" : "Xotira"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{storage}</span></div>
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "Цвет" : "Rang"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{color}</span></div>
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "SIM" : "SIM"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{sim}</span></div>
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "АКБ" : "Batareya"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{batteryHealth}</span></div>
                        <div className="flex justify-between"><span className="text-black/50 dark:text-white/50">{isRu ? "Комплект" : "Komplekt"}</span><span className="font-semibold text-black dark:text-white truncate pl-4">{box}</span></div>
                        <div className="flex justify-between border-t border-black/10 dark:border-white/10 pt-2 mt-2"><span className="text-black/50 dark:text-white/50">{isRu ? "Дефекты" : "Kamchiliklar"}</span><span className="font-semibold text-black dark:text-white text-right max-w-[60%]">{defects.join(", ") || "—"}</span></div>
                      </div>

                      <p className="text-xs text-black/30 dark:text-white/30 max-w-[280px]">{t.resultHint}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <p className="text-sm text-red-500 font-medium text-center mt-4">{error}</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 pb-8 pt-2 flex gap-3 bg-gradient-to-t from-white/80 dark:from-black/40 via-white/40 dark:via-black/20 to-transparent">
              {step > 1 && step < 8 && (
                <button
                  onClick={() => setStep(prev => (prev - 1) as Step)}
                  className="flex-1 py-3.5 rounded-2xl text-[15px] font-bold bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 active:scale-[0.97] transition-transform"
                >
                  {t.backBtn}
                </button>
              )}

              {step < 7 && (
                <button
                  onClick={() => setStep(prev => (prev + 1) as Step)}
                  disabled={!canProceed(step)}
                  className={`flex-1 py-3.5 rounded-2xl text-[15px] font-bold transition-all active:scale-[0.97] ${
                    canProceed(step)
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed"
                  }`}
                >
                  {t.nextBtn}
                </button>
              )}

              {step === 7 && (
                <button
                  onClick={handleCalculate}
                  disabled={!canProceed(step) || loading}
                  className={`flex-1 py-3.5 rounded-2xl text-[15px] font-bold transition-all active:scale-[0.97] ${
                    canProceed(step) && !loading
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.calculating}
                    </span>
                  ) : t.nextBtn}
                </button>
              )}

              {step === 8 && (
                <div className="flex-1 space-y-2.5">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t.submitBtn}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-2xl text-[15px] font-semibold text-black/40 dark:text-white/40 active:scale-[0.97] transition-transform"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
