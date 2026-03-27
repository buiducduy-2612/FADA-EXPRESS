"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowLeft, Plane, ShieldCheck, CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";

function ResetPasswordForm() {
    const { language } = useLanguage();
    const { systemName, logoUrl } = useSystem();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError(language === "vi" ? "Mật khẩu phải có ít nhất 6 ký tự." : "Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError(language === "vi" ? "Mật khẩu xác nhận không khớp." : "Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Đã xảy ra lỗi.");
            } else {
                setSuccess(true);
            }
        } catch {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // No token in URL
    if (!token) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-10 shadow-2xl text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                            {language === "vi" ? "Link không hợp lệ" : "Invalid Link"}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                            {language === "vi"
                                ? "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                                : "This password reset link is invalid or expired."}
                        </p>
                        <Link href="/forgot-password" className="inline-flex items-center justify-center gap-2 w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95">
                            {language === "vi" ? "Yêu cầu link mới" : "Request New Link"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8 transition-colors relative">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center bg-white rounded-2xl px-6 py-3 shadow-lg shadow-zinc-200/60 dark:shadow-zinc-900/60 mb-6 border border-zinc-100 dark:border-zinc-800">
                        <img src="/fada-logo.png" alt="FADA EXPRESS" className="h-12 w-auto object-contain" />
                    </div>
                    <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight uppercase">{systemName || "FADA EXPRESS"}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-brand-500" />
                        {language === "vi" ? "Đặt lại mật khẩu" : "Reset Password"}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-8 md:p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden transition-colors">
                    {success ? (
                        /* Success State */
                        <div className="text-center space-y-6 py-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                                    {language === "vi" ? "Thành công!" : "Success!"}
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {language === "vi"
                                        ? "Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới."
                                        : "Your password has been reset. You can now log in with your new password."}
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95"
                            >
                                {language === "vi" ? "Đăng nhập ngay" : "Go to Login"}
                            </Link>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                                    {language === "vi" ? "Tạo mật khẩu mới" : "Create New Password"}
                                </h2>
                                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {language === "vi"
                                        ? "Nhập mật khẩu mới cho tài khoản của bạn."
                                        : "Enter a new password for your account."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">
                                        {language === "vi" ? "Mật khẩu mới" : "New Password"}
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
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

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">
                                        {language === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="h-12 w-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 pl-11 pr-4 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Password strength indicator */}
                                {password.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(level => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-all ${
                                                        password.length >= level * 3
                                                            ? level <= 1 ? "bg-red-400"
                                                            : level <= 2 ? "bg-amber-400"
                                                            : level <= 3 ? "bg-blue-400"
                                                            : "bg-emerald-400"
                                                            : "bg-zinc-100 dark:bg-zinc-800"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                            {password.length < 6 ? (language === "vi" ? "Yếu — tối thiểu 6 ký tự" : "Weak — min 6 chars")
                                                : password.length < 9 ? (language === "vi" ? "Trung bình" : "Medium")
                                                : password.length < 12 ? (language === "vi" ? "Mạnh" : "Strong")
                                                : (language === "vi" ? "Rất mạnh" : "Very Strong")}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>{language === "vi" ? "Đặt lại mật khẩu" : "Reset Password"}</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/login"
                                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:hover:text-brand-500 uppercase tracking-widest transition-colors inline-flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    {language === "vi" ? "Quay về Đăng nhập" : "Back to Login"}
                                </Link>
                            </div>
                        </>
                    )}

                    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            CRM System v4.0 • FADA EXPRESS
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
