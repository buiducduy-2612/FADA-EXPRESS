import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            boxShadow: {
                soft: "0 4px 24px -4px rgba(0, 0, 0, 0.04)",
                brand: "0 8px 30px -4px rgba(249, 115, 22, 0.25)",
            },
            borderRadius: {
                "3xl": "1.25rem",
                "4xl": "1.5rem",
            },
            colors: {
                brand: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#f97316", // Orange primary
                    600: "#ea580c",
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                    950: "#431407",
                },
            },
            backdropBlur: {
                xs: "2px",
            },
            animation: {
                "fade-in-up": "fade-in-up 0.5s ease-out",
                "pulse-gentle": "pulse-gentle 3s infinite",
                "airplane-fly": "airplane-fly 3s ease-in-out infinite",
                "airplane-progress": "airplane-progress 3s ease-in-out infinite",
            },
            keyframes: {
                "fade-in-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "pulse-gentle": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                "airplane-fly": {
                    "0%, 100%": { transform: "translateX(-20px) translateY(0) rotate(0deg)" },
                    "25%": { transform: "translateX(0px) translateY(-5px) rotate(2deg)" },
                    "50%": { transform: "translateX(20px) translateY(-10px) rotate(5deg)" },
                    "75%": { transform: "translateX(0px) translateY(-5px) rotate(2deg)" },
                },
                "airplane-progress": {
                    "0%": { transform: "translateX(-100%)" },
                    "50%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
