import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { SystemProvider } from "@/context/SystemContext";
import { ToastProvider } from "@/context/ToastContext";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-inter"
});

export const metadata: Metadata = {
    title: "FADA EXPRESS | Air Freight Logistics CRM",
    description: "Hệ thống CRM vận chuyển hàng không quốc tế - Fada Express / Fada Logistics.",
    icons: {
        icon: [
            { url: "/favicon.jpg", type: "image/jpeg" },
        ],
        apple: "/favicon.jpg",
        shortcut: "/favicon.jpg",
    },
};

import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300`}>
                <SessionProvider>
                    <SystemProvider>
                        <LanguageProvider>
                            <ThemeProvider>
                                <ToastProvider>
                                    <ClientLayout>
                                        {children}
                                    </ClientLayout>
                                </ToastProvider>
                            </ThemeProvider>
                        </LanguageProvider>
                    </SystemProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
