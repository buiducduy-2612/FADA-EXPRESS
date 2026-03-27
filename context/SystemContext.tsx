"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface SystemSettings {
    systemName: string;
    logoUrl: string | null;
    refresh: () => Promise<void>;
}

const SystemContext = createContext<SystemSettings>({
    systemName: "FADA EXPRESS",
    logoUrl: "/fada-logo.png",
    refresh: async () => {},
});

export function SystemProvider({ children }: { children: React.ReactNode }) {
    const [systemName, setSystemName] = useState("FADA EXPRESS");
    const [logoUrl, setLogoUrl] = useState<string | null>("/fada-logo.png");

    const refresh = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSystemName(data.systemName || "FADA EXPRESS");
                setLogoUrl(data.logoUrl || "/fada-logo.png");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <SystemContext.Provider value={{ systemName, logoUrl, refresh }}>
            {children}
        </SystemContext.Provider>
    );
}

export const useSystem = () => useContext(SystemContext);
