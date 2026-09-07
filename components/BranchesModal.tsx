"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Compass,
  Store,
  ExternalLink,
} from "lucide-react";

type BranchItem = {
  id?: string;
  name: string;
  address: string;
  phone?: string | null;
  hours?: string;
  landmark?: string;
  mapUrl?: string;
};

type BranchesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: "RU" | "UZ";
  branches?: BranchItem[];
};

const DEFAULT_BRANCHES: BranchItem[] = [
  {
    id: "branch-1",
    name: "Филиал №1 (Главный)",
    address: "г. Самарканд, ул. Гульабад, 1",
    hours: "09:00 – 21:00",
    landmark: "Ориентир: напротив горбольницы",
    phone: "+998 77 285-99-99",
    mapUrl: "https://yandex.uz/maps/?text=Самарканд+улица+Гульабад+1",
  },
  {
    id: "branch-2",
    name: "Филиал №2 (ТЦ «Makon Mall»)",
    address: "г. Самарканд, ТЦ «Makon Mall», 1-й этаж",
    hours: "10:00 – 22:00",
    landmark: "1-й этаж, центральный вход",
    phone: "+998 77 285-99-99",
    mapUrl: "https://yandex.uz/maps/?text=Самарканд+Makon+Mall",
  },
];

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

export default function BranchesModal({
  isOpen,
  onClose,
  isDark,
  lang,
  branches,
}: BranchesModalProps) {
  const d = isDark;
  const isUz = lang === "UZ";

  const branchList = (branches && branches.length > 0 ? branches : DEFAULT_BRANCHES).map((b, idx) => {
    const defaultData = DEFAULT_BRANCHES[idx] || DEFAULT_BRANCHES[0];
    return {
      ...defaultData,
      ...b,
      hours: b.address?.includes("10:00")
        ? "10:00 – 22:00"
        : b.address?.includes("09:00")
        ? "09:00 – 21:00"
        : defaultData.hours,
    };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`
              relative z-10 w-full max-w-[430px] max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px]
              ${d ? "bg-[#111116] border-white/10 text-white" : "bg-[#F9F9FB] border-black/10 text-[#1C1C1E]"}
              border shadow-2xl p-5 pb-8 space-y-4
            `}
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-lg shadow-[#007AFF]/25">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {isUz ? "Bizning filiallarimiz" : "Наши филиалы"}
                  </h2>
                  <p className={`text-[11px] ${d ? "text-white/40" : "text-[#1C1C1E]/50"}`}>
                    {isUz ? "Samarqand shahri bo'yicha" : "г. Самарканд • 2 точки"}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={tapSpring}
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  d ? "bg-white/10 hover:bg-white/15 text-white/70" : "bg-black/5 hover:bg-black/10 text-black/70"
                } transition-colors cursor-pointer`}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Branch Cards */}
            <div className="space-y-3 pt-1">
              {branchList.map((branch, i) => {
                const cleanPhone = (branch.phone || "+998 77 285-99-99").replace(/\s+/g, "");
                return (
                  <div
                    key={branch.id || i}
                    className={`
                      p-4 rounded-2xl relative overflow-hidden transition-all
                      ${d ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]" : "bg-white border-black/10 shadow-sm hover:shadow"}
                      border
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-[#007AFF]" />
                          <h3 className="text-sm font-bold tracking-tight">
                            {branch.name}
                          </h3>
                        </div>
                        <p className={`text-xs mt-1 font-medium ${d ? "text-white/80" : "text-[#1C1C1E]/80"}`}>
                          {branch.address.replace(/\s*\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/, "")}
                        </p>
                        {branch.landmark && (
                          <p className={`text-[11px] mt-0.5 ${d ? "text-white/40" : "text-[#1C1C1E]/50"}`}>
                            {branch.landmark}
                          </p>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 shrink-0">
                        {isUz ? "Ochiq" : "Открыто"}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className={`mt-3 flex items-center gap-2 text-[11px] ${d ? "text-white/60" : "text-[#1C1C1E]/60"}`}>
                      <Clock size={13} className="text-[#007AFF]" />
                      <span>{branch.hours} • {isUz ? "Har kuni" : "Ежедневно"}</span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/[0.06]">
                      <a
                        href={`tel:${cleanPhone}`}
                        className={`
                          py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold
                          ${d ? "bg-white/10 hover:bg-white/15 text-white" : "bg-black/5 hover:bg-black/10 text-[#1C1C1E]"}
                          transition-all active:scale-95
                        `}
                      >
                        <Phone size={13} className="text-[#34C759]" />
                        <span>{isUz ? "Qo'ng'iroq" : "Позвонить"}</span>
                      </a>

                      <a
                        href={branch.mapUrl || `https://yandex.uz/maps/?text=${encodeURIComponent(branch.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#007AFF] hover:bg-[#007AFF]/90 text-white transition-all shadow-md shadow-[#007AFF]/20 active:scale-95"
                      >
                        <Navigation size={13} />
                        <span>{isUz ? "Xaritada" : "На карте"}</span>
                        <ExternalLink size={10} className="opacity-70" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Hotline Card */}
            <div
              className={`
                p-3.5 rounded-2xl flex items-center justify-between
                ${d ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20" : "bg-blue-50/70 border-blue-200"}
                border
              `}
            >
              <div>
                <p className={`text-[11px] ${d ? "text-white/50" : "text-blue-900/60"} font-medium`}>
                  {isUz ? "Yagona koll-markaz:" : "Единая служба поддержки:"}
                </p>
                <a
                  href="tel:+998772859999"
                  className="text-xs font-bold text-[#007AFF] hover:underline"
                >
                  +998 77 285-99-99
                </a>
              </div>

              <a
                href="https://t.me/mrnshkx"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#007AFF]/15 text-[#007AFF] hover:bg-[#007AFF]/25 text-[11px] font-bold transition-colors"
              >
                Telegram
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
