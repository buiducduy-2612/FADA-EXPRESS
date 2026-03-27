"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const isAuthPage = pathname === "/login" || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
    const isLandingPage = pathname.startsWith("/landing") || pathname.startsWith("/tracking");

    if (isAuthPage) {
        return <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">{children}</div>;
    }

    if (isLandingPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Sidebar with overlay for mobile */}
            <div
                className={`fixed inset-0 z-50 lg:static lg:inset-auto lg:z-auto transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div
                    className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    onClick={() => setIsSidebarOpen(false)}
                />
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="p-4 md:p-8 pb-12 w-full max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
