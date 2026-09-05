import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },

      /* ── iOS System Colors ── */
      colors: {
        "system-blue": "#007AFF",
        "system-green": "#34C759",
        "system-red": "#FF3B30",
        "system-orange": "#FF9500",
        "system-yellow": "#FFCC00",
        "system-teal": "#5AC8FA",

        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
        },

        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },

        // Legacy compatibility
        background: "var(--surface-primary)",
        card: "var(--surface-secondary)",
        accent: "var(--system-blue)",
        hint: "var(--text-secondary)",
        foreground: "var(--text-primary)",
      },

      /* ── Squircle Radii ── */
      borderRadius: {
        "glass-xs": "10px",
        "glass-sm": "14px",
        "glass-md": "18px",
        "glass-lg": "24px",
        "glass": "28px",
        "glass-xl": "34px",
        "glass-2xl": "38px",
        "glass-btn": "16px",
        pill: "980px",
      },

      /* ── Backdrop Blur Extremes ── */
      backdropBlur: {
        "3xl": "64px",
        "4xl": "80px",
        "5xl": "120px",
      },

      /* ── Glass Shadows ── */
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0.5px 0 rgba(255, 255, 255, 0.5)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0.5px 0 rgba(255, 255, 255, 0.05)",
        "glass-heavy": "0 12px 48px rgba(0, 0, 0, 0.12), inset 0 0.5px 0 rgba(255, 255, 255, 0.4)",
        "glass-float": "0 16px 64px rgba(0, 0, 0, 0.15)",
        "glass-float-dark": "0 16px 64px rgba(0, 0, 0, 0.7)",
        "system-blue": "0 4px 16px rgba(0, 122, 255, 0.25)",
        "system-blue-lg": "0 8px 24px rgba(0, 122, 255, 0.3)",
        "system-green": "0 4px 16px rgba(52, 199, 89, 0.25)",
        "system-red": "0 4px 16px rgba(255, 59, 48, 0.25)",
      },

      /* ── Animation ── */
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ios": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
