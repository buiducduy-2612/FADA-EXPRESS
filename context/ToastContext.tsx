"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showToast = (type: ToastType, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    };

    const toastContainer = mounted ? createPortal(
        <div
            className="fixed top-20 right-4 md:right-6 z-[99999] flex flex-col gap-3 pointer-events-none w-full max-w-[calc(100vw-2rem)] md:max-w-sm items-end"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-right-4 fade-in duration-300 pointer-events-auto w-full",
                        toast.type === "success"
                            ? "bg-emerald-600 shadow-emerald-500/20"
                            : "bg-red-600 shadow-red-500/20"
                    )}
                >
                    {toast.type === "success"
                        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                        : <XCircle className="w-5 h-5 shrink-0" />
                    }
                    <span className="leading-snug">{toast.message}</span>
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastContainer}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
