import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Montserrat", "sans-serif"], // default
        heading: ["var(--font-heading)", "Helvetica", "Arial", "sans-serif"],
        body: ["var(--font-body)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "mega-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "mega-panel": {
          from: { opacity: "0", transform: "translateX(6px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "listing-overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "listing-card-in": {
          from: { opacity: "0", transform: "scale(0.94) translateY(6px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "listing-dot": {
          "0%, 80%, 100%": { transform: "translate3d(0, 0, 0) scale(1)", opacity: "0.45" },
          "40%": { transform: "translate3d(0, -8px, 0) scale(1.08)", opacity: "1" },
        },
        "listing-glow": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.08)" },
        },
      },
      animation: {
        "mega-in": "mega-in 0.22s ease-out forwards",
        "mega-panel": "mega-panel 0.2s ease-out forwards",
        "listing-overlay-in": "listing-overlay-in 0.28s ease-out forwards",
        "listing-card-in": "listing-card-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "listing-dot": "listing-dot 0.9s ease-in-out infinite",
        "listing-glow": "listing-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
