"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#F2F2F7] dark:bg-[#07070b] transition-colors duration-300"
    >
      {/* ── Blob 1: Deep Royal / Navy Blue (Floating Top-Left) ── */}
      <motion.div
        animate={{
          x: [-50, 60, -30, -50],
          y: [-30, 50, 30, -30],
          scale: [1, 1.25, 0.95, 1],
          opacity: [0.2, 0.45, 0.25, 0.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[15%] -left-[10%] w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-[#0051FF] blur-[120px] opacity-25 dark:opacity-40 will-change-transform"
      />

      {/* ── Blob 2: Electric Violet / Purple (Floating Center-Right) ── */}
      <motion.div
        animate={{
          x: [40, -60, 20, 40],
          y: [50, -40, 30, 50],
          scale: [1.1, 0.9, 1.2, 1.1],
          opacity: [0.18, 0.4, 0.22, 0.18],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] -right-[15%] w-[360px] sm:w-[460px] h-[360px] sm:h-[460px] rounded-full bg-[#7928CA] blur-[130px] opacity-20 dark:opacity-35 will-change-transform"
      />

      {/* ── Blob 3: Cyan / Indigo Accent (Breathing Bottom-Left) ── */}
      <motion.div
        animate={{
          x: [-30, 40, -40, -30],
          y: [30, -50, -20, 30],
          scale: [0.92, 1.18, 1, 0.92],
          opacity: [0.15, 0.35, 0.2, 0.15],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[10%] left-[15%] w-[400px] sm:w-[520px] h-[400px] sm:h-[520px] rounded-full bg-[#0A84FF] blur-[140px] opacity-20 dark:opacity-30 will-change-transform"
      />

      {/* ── Blob 4: Deep Magenta Accent (Subtle ambient pulse) ── */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[65%] left-[50%] -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-[#9333EA] blur-[150px] opacity-15 dark:opacity-20 will-change-transform"
      />

      {/* ── Ambient Radial Vignette for contrast & readability ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(242,242,247,0.5)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,11,0.65)_100%)] pointer-events-none transition-colors duration-300" />

      {/* ── Micro-Grid / Noise texture effect (optional subtle depth) ── */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(128, 128, 128, 0.4) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
