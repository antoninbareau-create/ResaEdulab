import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#00B4C8",
          dark: "#1A2E4A",
          accent: "#FF6B35",
          surface: "#F5F7FA",
          border: "#E0E6ED",
          text: "#1C1C2E",
          muted: "#6B7A8D",
          success: "#00C896",
          warning: "#FFAA00",
          error: "#E84040",
          light: "#E0F9FC",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
        mono: ["'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
