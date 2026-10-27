import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
        line: token("line"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        sheet: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        eq: { "0%,100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
      },
      animation: {
        sheet: "sheet 0.28s cubic-bezier(0.22,1,0.36,1)",
        fade: "fade 0.2s ease-out",
        eq: "eq 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
