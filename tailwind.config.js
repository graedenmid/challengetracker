/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Indigo
          light: "#60A5FA",
          dark: "#2563EB",
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald
          light: "#34D399",
          dark: "#059669",
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber
          light: "#FBBF24",
          dark: "#D97706",
        },
        success: "#10B981", // Emerald
        error: "#EF4444", // Red
        warning: "#F59E0B", // Amber
        info: "#3B82F6", // Indigo
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        heading: ['"Open Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        button:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        hover:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  safelist: [
    "bg-primary",
    "bg-primary-light",
    "bg-primary-dark",
    "bg-secondary",
    "bg-secondary-light",
    "bg-secondary-dark",
    "bg-accent",
    "bg-accent-light",
    "bg-accent-dark",
    "text-primary",
    "text-primary-light",
    "text-primary-dark",
    "text-secondary",
    "text-secondary-light",
    "text-secondary-dark",
    "text-accent",
    "text-accent-light",
    "text-accent-dark",
  ],
  plugins: [],
};
