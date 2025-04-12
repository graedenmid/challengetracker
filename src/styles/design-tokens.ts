/**
 * Design tokens for the Challenge Tracker application
 * Based on the design guidelines
 */

export const colors = {
  primary: {
    main: "#3B82F6", // Indigo
    light: "#60A5FA",
    dark: "#2563EB",
  },
  secondary: {
    main: "#10B981", // Emerald
    light: "#34D399",
    dark: "#059669",
  },
  accent: {
    main: "#F59E0B", // Amber
    light: "#FBBF24",
    dark: "#D97706",
  },
  background: {
    main: "#F9FAFB", // Gray-50
    card: "#FFFFFF",
    dark: "#111827",
  },
  text: {
    body: "#374151", // Gray-700
    heading: "#1F2937", // Gray-800
    light: "#6B7280", // Gray-500
    white: "#FFFFFF",
  },
  status: {
    success: "#10B981", // Emerald
    error: "#EF4444", // Red
    warning: "#F59E0B", // Amber
    info: "#3B82F6", // Indigo
  },
  border: {
    light: "#E5E7EB", // Gray-200
    main: "#D1D5DB", // Gray-300
    dark: "#9CA3AF", // Gray-400
  },
};

export const typography = {
  fontFamily: {
    body: "Inter, system-ui, sans-serif",
    heading: '"Open Sans", system-ui, sans-serif',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

export const borderRadius = {
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
};

export const transitions = {
  default: "all 0.2s ease-in-out",
  slow: "all 0.3s ease-in-out",
  fast: "all 0.1s ease-in-out",
};

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};
