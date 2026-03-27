"use client";

import { useState } from "react";
import { Mail, Loader2, ArrowLeft, Plane, ShieldCheck, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";

export default function ForgotPasswordPage() {
    const { language } = useLanguage();
    const { systemName, logoUrl } = useSystem();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Đã xảy ra lỗi. Vui lòng thử lại.");
            } else {
                setSent(true);
                if (data.devResetUrl) {
                    setDevResetUrl(data.devResetUrl);
                }
            }
        } catch {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (devResetUrl) {
            navigator.clipboard.writeText(devResetUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                        {language === "vi" ? "Khôi phục tài khoản" : "Account Recovery"}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-8 md:p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden transition-colors">
                    {sent ? (
                        /* Success State */
                        <div className="text-center space-y-6 py-2">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                                    {language === "vi" ? "Yêu cầu đã gửi!" : "Request Submitted!"}
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {language === "vi"
                                        ? "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (và thư rác)."
                                        : "If the email exists in our system, you'll receive a password reset link. Please check your inbox (and spam folder)."}
                                </p>
                            </div>

                            {/* Dev mode: show reset link directly */}
                            {devResetUrl && (
                                <div className="text-left p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl space-y-3">
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                                        {language === "vi" ? "Chế độ Dev — Email chưa cấu hình" : "Dev Mode — Email Not Configured"}
                                    </p>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                        {language === "vi"
                                            ? "Link đặt lại mật khẩu được hiển thị trực tiếp vì email chưa được thiết lập:"
                                            : "Reset link shown directly since email is not configured:"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={devResetUrl}
                                            className="flex-1 text-[10px] font-mono text-brand-600 dark:text-brand-400 break-all hover:underline leading-relaxed"
                                        >
                                            {devResetUrl}
                                        </a>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 flex items-center justify-center gap-2 h-9 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                        >
                                            <Copy className="w-3 h-3" />
                                            {copied ? (language === "vi" ? "Đã sao chép!" : "Copied!") : (language === "vi" ? "Sao chép link" : "Copy Link")}
                                        </button>
                                        <a
                                            href={devResetUrl}
                                            className="flex-1 flex items-center justify-center gap-2 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-zinc-800"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {language === "vi" ? "Mở link" : "Open Link"}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {language === "vi" ? "Quay về Đăng nhập" : "Back to Login"}
                            </Link>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                                    {language === "vi" ? "Quên mật khẩu?" : "Forgot Password?"}
                                </h2>
                                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {language === "vi"
                                        ? "Nhập email tài khoản của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu."
                                        : "Enter your account email and we'll send you a password reset link."}
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
                                        {language === "vi" ? "Địa chỉ Email" : "Email Address"}
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="h-12 w-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 pl-11 pr-4 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>{language === "vi" ? "Gửi link đặt lại" : "Send Reset Link"}</span>
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
