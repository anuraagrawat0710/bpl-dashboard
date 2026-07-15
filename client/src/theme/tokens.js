// Shared design tokens for BPL Technologies Dashboard
// Import this in any component that needs consistent colors/type.

export const tokens = {
  bg: "#F5F6F8",
  cardBg: "#FFFFFF",
  border: "#E4E7EC",
  textPrimary: "#101828",
  textSecondary: "#667085",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const statAccents = {
  revenue: "#0F6E5D", // teal — money
  units: "#2C4A6E", // steel blue — machines/inventory
  today: "#B5792F", // amber — time-sensitive
  staff: "#6B4C9A", // muted violet — people
};

// Single consistent accent for region cards + region-related charts
export const regionAccent = "#1D4E89";

// Destructive/danger actions (bulk delete, out-of-stock, rejected) — one red
// used everywhere instead of mixing app red with default browser/Tailwind red
export const danger = "#B23B4E";
export const dangerBg = "#FBEDEF"; // light tint for banners/alert backgrounds
export const dangerBorder = "#EFC9CF";

// A calm, non-neon categorical palette for charts with multiple series/bars
// (used for Top Selling Machines, where each bar is a different machine)
export const chartPalette = [
  "#1D4E89",
  "#0F6E5D",
  "#B5792F",
  "#6B4C9A",
  "#B23B4E",
  "#3E7CB1",
];
