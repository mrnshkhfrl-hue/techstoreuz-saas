"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

type ToastType = "error" | "success" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "error", visible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const iconColors: Record<ToastType, string> = {
    error: "text-[#FF3B30]",
    success: "text-[#34C759]",
    warning: "text-[#FF9500]",
  };

  const fallbackIcons: Record<ToastType, JSX.Element> = {
    error: (
      <svg className={`w-5 h-5 ${iconColors.error}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className={`w-5 h-5 ${iconColors.success}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className={`w-5 h-5 ${iconColors.warning}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, x: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed top-4 left-1/2 z-[100] w-max max-w-[90vw]"
        >
          <div
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-glass-lg liquid-glass-float cursor-pointer transition-transform active:scale-95"
          >
            {fallbackIcons[type]}
            <p className="text-[15px] font-medium tracking-tight text-[var(--text-primary)]">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
