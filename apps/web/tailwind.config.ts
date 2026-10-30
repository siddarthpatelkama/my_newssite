import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--theme-paper, #ede8df)",
        ink: "var(--theme-ink, #242220)",
        rule: "var(--theme-rule, #d8d1c5)",
        crimson: "var(--theme-accent, #8c4b2d)",
        mute: "var(--theme-mute, #756f66)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
