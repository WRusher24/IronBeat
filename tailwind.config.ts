import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        fg: token("fg"),
        muted: token("muted"),
        card: token("card"),
        "card-fg": token("card-fg"),
        "card-muted": token("card-muted"),
        accent: token("accent"),
        "accent-fg": token("accent-fg"),
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "SF Pro Text", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
        display: ["ui-sans-serif", "system-ui", "-apple-system", "SF Pro Display", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        eq: { "0%,100%": { transform: "scaleY(0.25)" }, "50%": { transform: "scaleY(1)" } },
      },
      animation: {
        "sheet-up": "sheet-up 0.28s cubic-bezier(0.2,0.8,0.2,1)",
        fade: "fade 0.2s ease-out",
        eq: "eq 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
