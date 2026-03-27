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
          primary: "#4CE5A5",
          dark: "#445358",
          accent: "#FFAF24",
          surface: "#F5F7FA",
          border: "#E0E6ED",
          text: "#445358",
          muted: "#6B7880",
          success: "#4CE5A5",
          warning: "#FFAF24",
          error: "#E84040",
          light: "#E8FBF2",
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
