"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
    label: string;
    id: string;
    type?: string;
    placeholder?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    required?: boolean;
    options?: { label: string; value: string }[];
    isTextArea?: boolean;
    disabled?: boolean;
}

export default function FormField({
    label,
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    options,
    isTextArea = false,
    disabled = false
}: FormFieldProps) {
    const formatCurrency = (val: string | number) => {
        if (!val && val !== 0) return "";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "" || /^\d+$/.test(rawValue)) {
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    id: id,
                    value: rawValue
                }
            } as any;
            onChange(syntheticEvent);
        }
    };

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest block ml-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {options ? (
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full h-12 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : isTextArea ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={4}
                    className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200 resize-none disabled:opacity-50"
                />
            ) : type === "number" || id.toLowerCase().includes("amount") || id.toLowerCase().includes("revenue") || id.toLowerCase().includes("cost") || id.toLowerCase().includes("fee") ? (
                <div className="relative group">
                    <input
                        id={id}
                        type="text"
                        value={formatCurrency(value)}
                        onChange={handleCurrencyChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        className="w-full h-12 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200 disabled:opacity-50 pr-12 font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VND</div>
                </div>
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="w-full h-12 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200 disabled:opacity-50"
                />
            )}
        </div>
    );
}
