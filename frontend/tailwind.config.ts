import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/src/**/*.{ts,tsx}',
  ],
  theme: {
      fontFamily: {
        sans: ["var(--font-dm-sans)"],
        geist: ["var(--font-geist)"],
      },
      colors: {
        void: "#0a0a0a",
        char: "#1d1d1d",
        iron: "#3d3d3d",
        slate: "#505050",
        smoke: "#797979",
        graphite: "#161616",
        ink: "#282828",
        fog: "#686868",
        mist: "#c2c2c2",
        ash: "#b2b2b2",
        bone: "#e5e5e5",
        paper: "#ffffff",
        onyx: "#000000",
        "indigo-haze": "#6b62f2",
        "dawn-wash": "#9cafb8",
        
        border: "#282828", // ink
        input: "#282828", // ink
        ring: "#3d3d3d", // iron
        background: "#0a0a0a", // void
        foreground: "#e5e5e5", // bone
        primary: {
          DEFAULT: "#ffffff", // paper
          foreground: "#000000", // onyx
        },
        secondary: {
          DEFAULT: "#1d1d1d", // char
          foreground: "#e5e5e5", // bone
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff", // paper
        },
        muted: {
          DEFAULT: "#1d1d1d", // char
          foreground: "#c2c2c2", // mist
        },
        accent: {
          DEFAULT: "#3d3d3d", // iron
          foreground: "#e5e5e5", // bone
        },
        popover: {
          DEFAULT: "#1d1d1d", // char
          foreground: "#e5e5e5", // bone
        },
        card: {
          DEFAULT: "#1d1d1d", // char
          foreground: "#e5e5e5", // bone
        },
      },
      borderRadius: {
        pill: "9999px",
        tags: "9999px",
        cards: "24px",
        inputs: "10px",
        buttons: "9999px",
        icon: "4px",
        large: "40px",
        lg: "10px",
        md: "4px",
        sm: "2px",
      },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
