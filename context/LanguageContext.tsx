"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

type Language = "en" | "vi";
type Currency = "USD" | "VND";

const EXCHANGE_RATE_USD_VND = 25400;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    formatCurr: (amount: number, baseCurrency?: string) => string;
}

const translations: Record<Language, any> = { en, vi };

const AppLanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("vi");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem("app_lang") as Language;
        if (savedLang && translations[savedLang]) {
            setLanguageState(savedLang);
        } else {
            setLanguageState("vi");
            localStorage.setItem("app_lang", "vi");
        }

        setMounted(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_lang", lang);
    };

    const t = (path: string): string => {
        try {
            const keys = path.split(".");
            let currentPath: any = translations[language];

            for (const key of keys) {
                if (currentPath[key] === undefined) return path;
                currentPath = currentPath[key];
            }

            return typeof currentPath === "string" ? currentPath : path;
        } catch {
            return path;
        }
    };

    const formatCurr = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "decimal",
            maximumFractionDigits: 0
        }).format(amount) + " VND";
    };

    return (
        <AppLanguageContext.Provider value={{ language, setLanguage, t, formatCurr }}>
            {mounted ? children : <div className="invisible">{children}</div>}
        </AppLanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(AppLanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
