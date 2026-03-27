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
          primary: "#48E0A0",
          dark: "#405058",
          accent: "#F8A820",
          surface: "#F5F7FA",
          border: "#E0E6ED",
          text: "#3A4850",
          muted: "#6B7880",
          success: "#38D890",
          warning: "#F8A820",
          error: "#E84040",
          light: "#E0FAF0",
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
