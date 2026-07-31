/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["New Spirit", "Fraunces", "Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["New Spirit", "Fraunces", "Playfair Display", "serif"],
      },
      colors: {
        // Brand palette
        bb: {
          // Core palette — primary buttons, navigation, therapist identity, important actions
          forest: "#0A3323",
          "forest-2": "#254634",
          // Secondary buttons, information, cards, charts
          teal: "#105666",
          "teal-2": "#5F918D",
          // Progress, links, reflection, highlights
          sky: "#579FD1",
          blue: "#789B9F",
          "blue-2": "#B7CCD1",
          // Backgrounds, soft cards, empty states
          mist: "#CAE9FF",
          // Success, growth, positive feedback
          leaf: "#9ACD32",
          // Gentle emphasis, session reminders, encouragement
          "soft-light": "#E5EBA4",
          sage: "#D8E2D8",
          moss: "#E5EBE5",
          cream: "#F9F6F0",
          warm: "#FFFCF9",
          ink: "#1a2a20",
          rust: "#B4552D",
          mustard: "#D9C563",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(28, 56, 41, 0.06)",
        card: "0 12px 40px rgba(28, 56, 41, 0.08)",
        deep: "0 20px 60px rgba(28, 56, 41, 0.14)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up":  { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in":  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.24s ease-out",
        "accordion-up":   "accordion-up 0.24s ease-out",
        "fade-up":        "fade-up 0.9s ease-out both",
        "fade-in":        "fade-in 0.9s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
