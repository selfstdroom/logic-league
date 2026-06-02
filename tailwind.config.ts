import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        league: {
          black: "#07080d",
          panel: "#10131f",
          gold: "#d7b46a",
          silver: "#c6ccd8",
          muted: "#81889a",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(215, 180, 106, 0.18)",
      },
    },
  },
  plugins: [forms],
};

export default config;
