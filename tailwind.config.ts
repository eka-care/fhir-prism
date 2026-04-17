import type { Config } from "tailwindcss";
import colors from "./src/tailwind-theme-config/colors";
import border from "./src/tailwind-theme-config/border";
import spacing from "./src/tailwind-theme-config/spacing";

export default {
  prefix: "prism-",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
     screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      transparent: "transparent",
      ...colors,
      platformBgColor: "var(--platform-bg-color)",
      platformTextColor: "var(--platform-text-color)",
      platformBorderColor: "var(--platform-border-color)",
      red: "#FF0000",
    },
    backgroundColor: ({ theme }) => ({
      ...theme("colors"),
      inherit: "inherit",
    }),
    fill: ({ theme }) => ({ ...theme("colors"), current: "currentColor" }),
    spacing: { ...spacing },
    fontSize: ({ theme }) => ({ ...theme("spacing") }),
    lineHeight: ({ theme }) => ({ ...theme("spacing") }),
    padding: ({ theme }) => ({ ...theme("spacing") }),
    borderWidth: {
      ...border,
    },
    borderRadius: ({ theme }) => ({ ...theme("borderWidth") }),
    boxShadow: {
      none: "none",
      "elevation-5": "0px 1px 3px 0px rgba(0, 0, 0, 0.10)",
      "elevation-10": "0px 3px 9px 0px rgba(0, 59, 168, 0.10)",
      "elevation-50": "-4px 4px 8px 0px rgba(0, 0, 0, 0.12)",
      "elevation-100": "0px 12px 36px 0px rgba(0, 0, 0, 0.25)",
      "elevation-200": "0px 2px 8px 0px rgba(0, 0, 0, 0.16)",
      "elevation-300": "12px 0px 50px 0px rgba(0, 0, 0, 0.15)",
      "elevation-500": "0px 4px 4px -6px rgb(24, 39, 75)",
      "elevation-600": "0px -2px 4px 0px rgba(0, 0, 0, 0.16)",
      "elevation-900": "0px 12px 50px 0px rgba(0, 0, 0, 0.15)",
      "elevation-1000": "0px 0px 8px 0px rgba(0, 0, 0, 0.16)",
      "elevation-1100": "0px 12px 16px 0px rgba(0, 0, 0, 0.16)",
      "elevation-only-top": "0px -4px 14.8px 0px rgba(0, 0, 0, 0.05)",
      "M3-1":
        "0px 4px 4px 0px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
    },
    fontWeight: {
      300: "300",
      400: "400",
      500: "500",
      600: "600",
      700: "700",
      800: "800",
      900: "900",
    },
    opacity: {
      0: "0",
      5: "0.05",
      10: "0.1",
      20: "0.2",
      25: "0.25",
      30: "0.3",
      40: "0.4",
      50: "0.5",
      60: "0.6",
      65: "0.65",
      70: "0.7",
      75: "0.75",
      80: "0.8",
      85: "0.85",
      90: "0.9",
      95: "0.95",
      100: "1",
    },
    outlineWidth: ({ theme }) => ({ ...theme("spacing") }),
    fontFamily: {
      lato: ["Lato", "sans-serif"],
    },
    maxWidth: ({ theme, breakpoints }) => ({
      none: "none",
      "3/5": "60%",
      half: "50%",
      full: "100%",
      min: "min-content",
      max: "max-content",
      ...breakpoints(theme("screens")),
      ...theme("spacing"),
    }),
    minWidth: ({ theme }) => ({
      ...theme("spacing"),
      half: "50%",
      full: "100%",
      screen: "100vw",
      min: "min-content",
      max: "max-content",
      auto: "auto",
    }),
    keyframes: {
      spin: {
        to: {
          transform: "rotate(360deg)",
        },
      },
      "fade-in": {
        "0%": { opacity: "0" },
        "100%": { opacity: "1" },
      },
      "slide-up": {
        "0%": { transform: "translateY(10px)" },
        "100%": { transform: "translateY(0)" },
      },
    },
    animation: {
      spin: "spin 1s linear infinite",
      "fade-in": "fade-in 0.2s ease-out",
      "slide-up": "slide-up 0.2s ease-out",
    },
    extend: {
      maxHeight: {
        "1/2": "50vh",
      },
    },
  },
  plugins: [],
} satisfies Config;
