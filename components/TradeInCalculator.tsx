"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Check,
  MessageCircle,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES & PROPS
   ═══════════════════════════════════════════════════════ */

type TradeInCalculatorProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: "RU" | "UZ";
  currency: "USD" | "UZS";
  currencyRate: number;
};

/* ═══════════════════════════════════════════════════════
   HARDCODED DATA (will be replaced by DB later)
   ═══════════════════════════════════════════════════════ */

/* ── SVG Brand Logos ── */

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 814 1000" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.4-105.7-208.3-105.7-328.2 0-193.3 125.7-296 249.5-296 65.7 0 120.9 43.2 162.5 43.2 39.7 0 101.5-45.8 176.2-45.8 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.7 15.6 1.3 18.2 2.6.6 6.4 1.3 10.2 1.3 45.4 0 103.3-30.4 139.5-71.4z" />
    </svg>
  );
}

function SamsungLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 2500 400" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="340" letterSpacing="40">SAMSUNG</text>
    </svg>
  );
}

/* ── Brand data (ready for API replacement) ── */

const AVAILABLE_BRANDS = [
  { id: "apple", name: "Apple", icon: AppleLogo },
  { id: "samsung", name: "Samsung", icon: SamsungLogo },
];

const MODELS: Record<string, { id: string; name: string }[]> = {
  apple: [
    { id: "ip16pm", name: "iPhone 16 Pro Max" },
    { id: "ip16p", name: "iPhone 16 Pro" },
    { id: "ip15pm", name: "iPhone 15 Pro Max" },
    { id: "ip15p", name: "iPhone 15 Pro" },
    { id: "ip15", name: "iPhone 15" },
    { id: "ip14pm", name: "iPhone 14 Pro Max" },
    { id: "ip14p", name: "iPhone 14 Pro" },
    { id: "ip13p", name: "iPhone 13 Pro" },
  ],
  samsung: [
    { id: "s25u", name: "Galaxy S25 Ultra" },
    { id: "s24u", name: "Galaxy S24 Ultra" },
    { id: "s24p", name: "Galaxy S24+" },
    { id: "s23u", name: "Galaxy S23 Ultra" },
    { id: "zf6", name: "Galaxy Z Fold 6" },
  ],
};

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITIONS = [
  { id: "turns_on", labelRU: "Включается и работает?", labelUZ: "Yoqiladi va ishlaydi?", positive: true },
  { id: "repaired", labelRU: "Был в ремонте?", labelUZ: "Ta'mirda bo'lganmi?", positive: false },
  { id: "scratches", labelRU: "Есть глубокие царапины?", labelUZ: "Chuqur tirnalishlar bormi?", positive: false },
  { id: "full_kit", labelRU: "Полный комплект (коробка)?", labelUZ: "To'liq komplekt (quti)?", positive: true },
];

/* Price estimation logic (mock) */
function estimatePrice(
  brand: string,
  model: string,
  storage: string,
  conditions: Record<string, boolean>
): number {
  let base = 400;
  if (brand === "apple") base = 550;
  if (brand === "samsung") base = 420;

  const storageMultiplier: Record<string, number> = {
    "64GB": 0.7,
    "128GB": 0.85,
    "256GB": 1.0,
    "512GB": 1.25,
    "1TB": 1.5,
  };
  base *= storageMultiplier[storage] || 1;

  if (model.includes("Pro Max") || model.includes("Ultra")) base *= 1.4;
  else if (model.includes("Pro") || model.includes("+")) base *= 1.2;
  else if (model.includes("Fold")) base *= 1.5;

  if (model.includes("16") || model.includes("25")) base *= 1.3;
  else if (model.includes("15") || model.includes("24")) base *= 1.1;
  else if (model.includes("14") || model.includes("23")) base *= 0.9;
  else if (model.includes("13")) base *= 0.7;

  if (!conditions.turns_on) base *= 0.3;
  if (conditions.repaired) base *= 0.8;
  if (conditions.scratches) base *= 0.85;
  if (conditions.full_kit) base *= 1.05;

  return Math.round(base / 10) * 10;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function fmtPrice(usd: number, rate: number, currency: "USD" | "UZS"): string {
  if (currency === "USD") return `$${usd.toLocaleString("en-US")}`;
  const sum = Math.round(usd * rate);
  return `${sum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} сум`;
}

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

/* Slide direction variants */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function TradeInCalculator({
  isOpen,
  onClose,
  isDark,
  lang,
  currency,
  currencyRate,
}: TradeInCalculatorProps) {
  const d = isDark;

  /* ── Wizard state ── */
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [conditions, setConditions] = useState<Record<string, boolean>>({
    turns_on: true,
    repaired: false,
    scratches: false,
    full_kit: true,
  });

  /* Derived */
  const models = MODELS[selectedBrand] || [];
  const modelName =
    models.find((m) => m.id === selectedModel)?.name || "";
  const brandName = AVAILABLE_BRANDS.find(b => b.id === selectedBrand)?.name || "";

  const estimatedUSD = useMemo(() => {
    if (step < 5) return 0;
    return estimatePrice(selectedBrand, modelName, selectedStorage, conditions);
  }, [step, selectedBrand, modelName, selectedStorage, conditions]);

  /* Navigation */
  const canProceed =
    (step === 1 && selectedBrand) ||
    (step === 2 && selectedModel) ||
    (step === 3 && selectedStorage) ||
    step === 4;

  function goNext() {
    if (!canProceed) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, 5));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  function resetAndClose() {
    onClose();
    setTimeout(() => {
      setStep(1);
      setDirection(1);
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedStorage("");
      setConditions({ turns_on: true, repaired: false, scratches: false, full_kit: true });
    }, 350);
  }

  /* Toggle condition */
  function toggleCondition(id: string) {
    setConditions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /* Step titles */
  const stepTitles = {
    1: lang === "RU" ? "Выберите бренд" : "Brendni tanlang",
    2: lang === "RU" ? "Выберите модель" : "Modelni tanlang",
    3: lang === "RU" ? "Объём памяти" : "Xotira hajmi",
    4: lang === "RU" ? "Состояние устройства" : "Qurilma holati",
    5: lang === "RU" ? "Оценка Trade-In" : "Trade-In bahosi",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* ── Full-screen Sheet ── */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={`
              fixed bottom-0 left-0 right-0 mx-auto
              w-full max-w-[430px] z-[90]
              rounded-t-glass-2xl overflow-hidden
              liquid-glass-sheet
              flex flex-col
            `}
            style={{
              height: "92vh",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            {/* ─── Header ─── */}
            <div
              className={`
                flex items-center justify-between px-5 pt-4 pb-3
                border-b ${d ? "border-white/[0.04]" : "border-black/[0.04]"}
              `}
            >
              {/* Drag handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2">
                <div className={`w-9 h-[5px] rounded-full ${d ? "bg-white/20" : "bg-black/15"}`} />
              </div>

              {/* Back button */}
              {step > 1 && step < 5 ? (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={tapSpring}
                  onClick={goBack}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center liquid-glass
                    transition-colors
                  `}
                >
                  <ChevronLeft size={18} className={d ? "text-white/70" : "text-[#1C1C1E]/70"} />
                </motion.button>
              ) : (
                <div className="w-8" />
              )}

              {/* Title */}
              <h3 className={`text-[15px] font-bold ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                {stepTitles[step as keyof typeof stepTitles]}
              </h3>

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={tapSpring}
                onClick={resetAndClose}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center liquid-glass
                  transition-colors
                `}
              >
                <X size={16} className={d ? "text-white/70" : "text-[#1C1C1E]/70"} />
              </motion.button>
            </div>

            {/* ─── Progress bar ─── */}
            <div className="px-5 pt-3 pb-1">
              <div className={`h-1 rounded-full overflow-hidden ${d ? "bg-white/[0.06]" : "bg-black/[0.06]"}`}>
                <motion.div
                  className="h-full bg-[#007AFF] rounded-full shadow-md shadow-[#007AFF]/20"
                  initial={false}
                  animate={{ width: `${(step / 5) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
              <p className={`text-[10px] font-medium mt-1.5 ${d ? "text-white/30" : "text-[#1C1C1E]/30"}`}>
                {lang === "RU" ? `Шаг ${step} из 5` : `${step}-qadam / 5`}
              </p>
            </div>

            {/* ─── Step Content (Scrollable) ─── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-4">
              <AnimatePresence mode="wait" custom={direction}>
                {/* ════════ STEP 1: Brand ════════ */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="grid grid-cols-2 gap-3 pt-2"
                  >
                    {AVAILABLE_BRANDS.map((brand) => {
                      const isActive = selectedBrand === brand.id;
                      const IconComponent = brand.icon;
                      return (
                        <motion.button
                          key={brand.id}
                          whileTap={{ scale: 0.95 }}
                          transition={tapSpring}
                          onClick={() => setSelectedBrand(brand.id)}
                          className={`
                            relative p-6 rounded-glass flex flex-col items-center justify-center gap-4
                            transition-all duration-300 aspect-[4/3] liquid-glass glass-edge-highlight
                            ${isActive ? `border-[#007AFF] ring-2 ring-[#007AFF]/20 bg-[#007AFF]/10` : ``}
                          `}
                        >
                          {/* Logo */}
                          <IconComponent
                            className={`
                              ${brand.id === "apple" ? "w-10 h-10" : "w-28 h-7"}
                              transition-colors duration-300
                              ${
                                isActive
                                  ? "text-[#007AFF]"
                                  : d ? "text-white/60" : "text-[#1C1C1E]/60"
                              }
                            `}
                          />

                          {/* Name label */}
                          <p
                            className={`text-[14px] font-semibold transition-colors duration-300 ${
                              isActive
                                ? "text-[#007AFF]"
                                : d ? "text-white/70" : "text-[#1C1C1E]/70"
                            }`}
                          >
                            {brand.name}
                          </p>

                          {/* Checkmark */}
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                              className="absolute top-3 right-3 w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center shadow-md shadow-[#007AFF]/30"
                            >
                              <Check size={14} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* ════════ STEP 2: Model ════════ */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="space-y-2"
                  >
                    {models.map((model, i) => (
                      <motion.button
                        key={model.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedModel(model.id)}
                        className={`
                          w-full px-4 py-3.5 rounded-glass-btn text-left flex items-center justify-between
                          transition-all duration-200 liquid-glass glass-edge-highlight
                          ${
                            selectedModel === model.id
                              ? `border-[#007AFF] bg-[#007AFF]/10`
                              : ``
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone
                            size={16}
                            className={
                              selectedModel === model.id
                                ? "text-[#007AFF]"
                                : d ? "text-white/30" : "text-[#1C1C1E]/30"
                            }
                          />
                          <p
                            className={`font-semibold text-[14px] ${
                              selectedModel === model.id
                                ? "text-[#007AFF]"
                                : d ? "text-white/80" : "text-[#1C1C1E]/80"
                            }`}
                          >
                            {model.name}
                          </p>
                        </div>
                        {selectedModel === model.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-[#007AFF] rounded-full flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ════════ STEP 3: Storage ════════ */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <div className="grid grid-cols-3 gap-2.5">
                      {STORAGE_OPTIONS.map((s) => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedStorage(s)}
                          className={`
                            py-4 rounded-glass-btn text-center font-bold text-[14px]
                            transition-all duration-200 
                            ${
                              selectedStorage === s 
                                ? "bg-[#007AFF] text-white border border-[#007AFF] shadow-md shadow-[#007AFF]/20" 
                                : `liquid-glass ${d ? "text-white/50" : "text-[#1C1C1E]/50"}`
                            }
                          `}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ════════ STEP 4: Condition ════════ */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="space-y-3"
                  >
                    {CONDITIONS.map((cond, i) => {
                      const isOn = conditions[cond.id];
                      return (
                        <motion.button
                          key={cond.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleCondition(cond.id)}
                          className={`
                            w-full p-4 rounded-glass-btn flex items-center justify-between
                            transition-all duration-200 liquid-glass glass-edge-highlight
                          `}
                        >
                          <p className={`font-medium text-[14px] ${d ? "text-white/80" : "text-[#1C1C1E]/80"}`}>
                            {lang === "RU" ? cond.labelRU : cond.labelUZ}
                          </p>

                          {/* iOS-style toggle */}
                          <div
                            className={`
                              w-[50px] h-[30px] rounded-full relative transition-colors duration-300 flex-shrink-0
                              ${
                                isOn
                                  ? cond.positive
                                    ? "bg-[#34C759] shadow-inner shadow-[#34C759]/30"
                                    : "bg-[#FF9500] shadow-inner shadow-[#FF9500]/30"
                                  : d
                                    ? "bg-white/10"
                                    : "bg-black/10"
                              }
                            `}
                          >
                            <motion.div
                              className="absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md"
                              animate={{ left: isOn ? 23 : 3 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* ════════ STEP 5: Result ════════ */}
                {step === 5 && (
                  <motion.div
                    key="step-5"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="flex flex-col items-center text-center pt-4"
                  >
                    {/* Success icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 rounded-glass bg-[#007AFF]/10 border border-[#007AFF]/15 flex items-center justify-center mb-6 shadow-xl shadow-[#007AFF]/10"
                    >
                      <ArrowLeftRight size={32} className="text-[#007AFF]" />
                    </motion.div>

                    <h2 className={`text-2xl font-bold tracking-tight mb-2 ${d ? "text-white" : "text-[#1C1C1E]"}`}>
                      {lang === "RU" ? "Предварительная оценка" : "Dastlabki baho"}
                    </h2>
                    
                    <p className={`text-[13px] mb-6 max-w-[260px] leading-relaxed ${d ? "text-white/40" : "text-[#1C1C1E]/40"}`}>
                      {lang === "RU"
                        ? `За ваш ${brandName} ${modelName} (${selectedStorage}) мы готовы предложить:`
                        : `Sizning ${brandName} ${modelName} (${selectedStorage}) uchun taklif qilamiz:`}
                    </p>

                    <div className="liquid-glass glass-edge-highlight p-5 rounded-glass w-full mb-6 relative overflow-hidden">
                      {/* Subdued glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/10 rounded-full blur-2xl" />
                      
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${d ? "text-[#007AFF]" : "text-[#007AFF]"}`}>
                        {lang === "RU" ? "Скидка до" : "Chegirma"}
                      </p>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`text-[34px] font-black tracking-tight leading-none ${d ? "text-white" : "text-[#1C1C1E]"}`}
                      >
                        {fmtPrice(estimatedUSD, currencyRate, currency)}
                      </motion.p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      transition={tapSpring}
                      className="w-full py-4 btn-system-blue text-[15px] rounded-glass-btn flex items-center justify-center gap-2 mb-3"
                    >
                      <MessageCircle size={18} />
                      {lang === "RU" ? "Связаться с менеджером" : "Menejer bilan bog'lanish"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Bottom CTA (for Steps 1-4) ─── */}
            {step < 5 && (
              <div
                className={`
                  p-5 border-t backdrop-blur-3xl
                  ${d ? "border-white/[0.08] bg-black/40" : "border-black/[0.08] bg-white/60"}
                `}
              >
                <motion.button
                  whileTap={canProceed ? { scale: 0.96 } : {}}
                  transition={tapSpring}
                  onClick={goNext}
                  disabled={!canProceed}
                  className={`
                    w-full py-4 rounded-glass-btn text-[15px] font-bold flex items-center justify-center gap-2
                    transition-all duration-300
                    ${
                      canProceed
                        ? "btn-system-blue"
                        : d
                          ? "bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.04]"
                          : "bg-black/[0.04] text-[#1C1C1E]/20 cursor-not-allowed border border-black/[0.04]"
                    }
                  `}
                >
                  {lang === "RU" ? "Далее" : "Keyingisi"}
                  <ChevronRight size={18} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
