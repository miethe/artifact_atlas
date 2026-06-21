import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand / accent
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Purple (agent/AI actions)
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        // Status colors (always paired with labels)
        status: {
          inbox: "#6b7280",      // gray-500
          raw: "#9333ea",        // purple-600
          candidate: "#2563eb",  // brand-600
          in_review: "#d97706",  // amber-600
          in_progress: "#0891b2", // cyan-600
          selected: "#059669",   // emerald-600
          canonical: "#16a34a",  // green-600
          archived: "#6b7280",   // gray-500
        },
        // Sensitivity colors (always paired with labels)
        sensitivity: {
          public: "#16a34a",           // green-600
          personal: "#2563eb",         // brand-600
          work_sensitive: "#d97706",   // amber-600
          client_sensitive: "#dc2626", // red-600
          restricted: "#991b1b",       // red-800
        },
        // Agent access
        access: {
          none: "#6b7280",
          metadata_only: "#9333ea",
          preview_allowed: "#2563eb",
          read_allowed: "#059669",
          context_pack_allowed: "#16a34a",
        },
        // Surface / ink semantic tokens (reference CSS vars too)
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          sunken: "var(--surface-sunken)",
          overlay: "var(--surface-overlay)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
          inverse: "var(--ink-inverse)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        bg: {
          DEFAULT: "var(--bg)",
          subtle: "var(--bg-subtle)",
        },
      },
      borderRadius: {
        card: "8px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        full: "9999px",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
        xs: ["12px", { lineHeight: "18px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "22px" }],
        md: ["15px", { lineHeight: "24px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "28px" }],
        "2xl": ["22px", { lineHeight: "32px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
      },
      spacing: {
        px: "1px",
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        11: "44px",
        12: "48px",
        14: "56px",
        16: "64px",
        18: "72px",
        20: "80px",
        24: "96px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover":
          "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)",
        drawer:
          "-4px 0 24px 0 rgb(0 0 0 / 0.08), -1px 0 3px 0 rgb(0 0 0 / 0.05)",
        modal:
          "0 20px 60px 0 rgb(0 0 0 / 0.14), 0 4px 16px -2px rgb(0 0 0 / 0.08)",
        "focus-ring": "0 0 0 2px var(--color-brand-500)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      transitionDuration: {
        fast: "100ms",
        DEFAULT: "150ms",
        slow: "250ms",
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-out",
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-in-up": "slideInUp 200ms ease-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { transform: "translateX(16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
