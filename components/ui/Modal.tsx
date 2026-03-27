"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: ModalProps) {
    const [isRendered, setIsRendered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            setIsRendered(true);
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        } else {
            const timer = setTimeout(() => {
                setIsRendered(false);
                document.body.style.overflow = "unset";
            }, 300);
            window.removeEventListener("keydown", handleEsc);
            return () => clearTimeout(timer);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!mounted || (!isRendered && !isOpen)) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
                isOpen ? "bg-zinc-900/40 backdrop-blur-md opacity-100" : "bg-zinc-900/0 backdrop-blur-none opacity-0 pointer-events-none"
            )}
            onClick={onClose}
        >
            <div
                className={cn(
                    "bg-white dark:bg-zinc-900 w-full rounded-3xl shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 transform border border-transparent dark:border-zinc-800/50",
                    maxWidth,
                    isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex items-center justify-between border-b border-transparent dark:border-zinc-800/50">
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh] text-zinc-600 dark:text-zinc-300">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
