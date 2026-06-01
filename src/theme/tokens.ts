// Single source of design tokens. Components reference these (or Tailwind classes
// mapped to the same CSS variables) — never hardcode colors/spacing in components.
export const tokens = {
  color: {
    accent: "hsl(221 83% 53%)",
    accentSoft: "hsl(221 83% 96%)",
    surface: "hsl(0 0% 100%)",
    border: "hsl(220 13% 91%)",
    text: "hsl(222 47% 11%)",
    textMuted: "hsl(215 16% 47%)",
    success: "hsl(142 71% 45%)",
    danger: "hsl(0 72% 51%)",
  },
  radius: { card: "0.875rem", chip: "9999px" },
  space: { xs: "0.5rem", sm: "0.75rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  font: { heading: "600 1.5rem/1.2 system-ui", body: "400 0.95rem/1.5 system-ui" },
} as const;
