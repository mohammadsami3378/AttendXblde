/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4F46E5",
          secondary: "#06B6D4",
          accent: "#22C55E",
          bgFrom: "#0F172A",
          bgTo: "#020617",
        },
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.35)",
        lift: "0 20px 50px rgba(0,0,0,0.45)",
      },
      backdropBlur: {
        glass: "14px",
      },
    },
  },
  plugins: [],
};

