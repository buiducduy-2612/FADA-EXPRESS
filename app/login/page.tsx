"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Plane, ShieldCheck, Eye, EyeOff, Globe } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";

export default function LoginPage() {
    const { t, language, setLanguage } = useLanguage();
    const { systemName, logoUrl } = useSystem();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                if (res.error === "CredentialsSignin") {
                    setError(t("login.error"));
                } else {
                    setError(res.error || t("login.error"));
                }
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err: any) {
            console.error("Login catch error:", err);
            // If it's a network error or something else, show the message
            const msg = err.message || t("login.system_error");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8 transition-colors relative">
            
            {/* Language Switcher Overlay */}
            <div className="absolute top-8 right-8 z-10">
                <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-all flex items-center space-x-2 ${language === 'en' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <span>EN</span>
                    </button>
                    <button
                        onClick={() => setLanguage("vi")}
                        className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-all flex items-center space-x-2 ${language === 'vi' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <span>VN</span>
                    </button>
                </div>
            </div>

            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center bg-white rounded-2xl px-6 py-3 shadow-lg shadow-zinc-200/60 dark:shadow-zinc-900/60 mb-6 border border-zinc-100 dark:border-zinc-800">
                        <img src="/fada-logo.png" alt="FADA EXPRESS" className="h-12 w-auto object-contain" />
                    </div>
                    <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight uppercase">{systemName || "FADA EXPRESS"}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-brand-500" />
                        {t("login.subtitle")}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-8 md:p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden transition-colors">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">{t("login.email")}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    autoComplete="email"
                                    className="h-12 w-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 pl-11 pr-4 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">{t("login.password")}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all shadow-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="h-12 w-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 pl-11 pr-12 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider">
                            <label className="flex items-center text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                <input type="checkbox" className="mr-2 w-4 h-4 rounded-lg border-zinc-200 dark:border-zinc-800 text-brand-500 focus:ring-brand-500/20" />
                                {t("login.remember_me")}
                            </label>
                            <Link href="/forgot-password" className="text-brand-600 hover:text-brand-700 dark:hover:text-brand-500 transition-colors">
                                {t("login.forgot_password")}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>{t("login.sign_in")}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {t("login.version")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
