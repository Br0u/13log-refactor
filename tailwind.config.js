/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background-hsl) / <alpha-value>)",
        foreground: "hsl(var(--foreground-hsl) / <alpha-value>)",
        border: "hsl(var(--border-hsl) / <alpha-value>)",
        muted: "hsl(var(--muted-hsl) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground-hsl) / <alpha-value>)",
      },
    },
  },
  plugins: [],
}
