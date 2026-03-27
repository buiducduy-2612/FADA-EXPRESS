"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
    ShieldCheck,
    User,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    Mail,
    Phone,
    FileText,
    RefreshCw,
    UserCheck,
    AlertTriangle,
    Search
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    contact?: string;
    industry?: string;
    taxCode?: string;
    tier: string;
    isApproved: boolean;
    createdAt: string;
    personInChargeId?: string;
    personInCharge?: { id: string; name: string; email: string };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function CustomerApprovePage() {
    return (
        <Suspense fallback={<div className="p-8 font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Approval Queue...</div>}>
            <CustomerApproveContent />
        </Suspense>
    );
}

function CustomerApproveContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const currentUser = session?.user as any;

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Redirect if not authorized
    useEffect(() => {
        if (session && currentUser?.role !== "ADMIN" && currentUser?.role !== "DIRECTOR") {
            router.push("/");
        }
    }, [session, currentUser, router]);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [custRes, usersRes] = await Promise.all([
                fetch("/api/customers?status=pending"),
                fetch("/api/users")
            ]);
            if (custRes.ok) setCustomers(await custRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (customerId: string, picId?: string) => {
        setProcessingId(customerId);
        try {
            const body: any = { isApproved: true };
            if (picId) body.personInChargeId = picId;

            const res = await fetch(`/api/customers/${customerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast("success", "Khách hàng đã được duyệt thành công!");
                setCustomers(prev => prev.filter(c => c.id !== customerId));
            } else {
                const err = await res.json();
                showToast("error", err.error || "Lỗi khi duyệt khách hàng");
            }
        } catch (err) {
            showToast("error", "Lỗi kết nối máy chủ");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (customerId: string) => {
        if (!confirm("Bạn có muốn xóa yêu cầu khách hàng này không?")) return;
        setProcessingId(customerId);
        try {
            const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
            if (res.ok) {
                showToast("success", "Đã xóa yêu cầu khách hàng.");
                setCustomers(prev => prev.filter(c => c.id !== customerId));
            } else {
                showToast("error", "Lỗi khi xóa khách hàng");
            }
        } catch (err) {
            showToast("error", "Lỗi kết nối máy chủ");
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.contact || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const saleUsers = users.filter(u => u.role === "SALE" || u.role === "CS");

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-20 right-4 z-[99999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all animate-in slide-in-from-top-4",
                    toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
                )}>
                    {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900/50 p-10 rounded-[48px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm relative overflow-hidden">
                <div className="absolute right-8 top-8 opacity-[0.04]">
                    <ShieldCheck className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter uppercase">
                                    Duyệt Khách Hàng
                                </h1>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em] mt-0.5">
                                    Customer Approval Queue
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg">
                            Xem xét và duyệt các Khách hàng mới do nhân viên Sales tạo. Sau khi duyệt, khách hàng sẽ chuyển vào danh sách Khách hàng chính.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{customers.length}</p>
                            </div>
                            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Chờ duyệt</p>
                        </div>
                        <button
                            onClick={fetchData}
                            className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className={cn("w-4 h-4 text-zinc-600", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Tìm theo tên, email, người liên hệ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-6 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                />
            </div>

            {/* Customer Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-[32px] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900/50 rounded-[48px] border border-zinc-100 dark:border-zinc-800/50 p-20 text-center shadow-sm">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
                        {searchQuery ? "Không tìm thấy kết quả" : "Hàng đợi trống!"}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-2">
                        {searchQuery ? "Thử từ khóa khác" : "Tất cả Khách hàng mới đã được duyệt."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map(cust => (
                        <CustomerCard
                            key={cust.id}
                            customer={cust}
                            saleUsers={saleUsers}
                            processingId={processingId}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CustomerCard({
    customer,
    saleUsers,
    processingId,
    onApprove,
    onReject
}: {
    customer: Customer;
    saleUsers: User[];
    processingId: string | null;
    onApprove: (id: string, picId?: string) => void;
    onReject: (id: string) => void;
}) {
    const [selectedPic, setSelectedPic] = useState(customer.personInChargeId || "");
    const isProcessing = processingId === customer.id;

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-[40px] border border-amber-200/60 dark:border-amber-800/30 shadow-sm hover:shadow-xl transition-all hover:border-amber-300 dark:hover:border-amber-700 overflow-hidden group">
            {/* Card Header */}
            <div className="p-8 pb-5">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform uppercase">
                            {customer.name[0]}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight uppercase leading-tight">
                                {customer.name}
                            </h3>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
                                Chờ duyệt
                            </span>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        {formatDate(customer.createdAt)}
                    </span>
                </div>

                <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="font-medium truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-medium">{customer.phone}</span>
                        </div>
                    )}
                    {customer.contact && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <User className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-medium">{customer.contact}</span>
                        </div>
                    )}
                    {customer.industry && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-medium">{customer.industry}</span>
                        </div>
                    )}
                    {customer.taxCode && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-medium">MST: {customer.taxCode}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* PIC Assignment */}
            <div className="px-8 pb-5">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-4 h-4 text-zinc-500" />
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                            Gán nhân viên phụ trách (PIC)
                        </label>
                    </div>
                    <select
                        value={selectedPic}
                        onChange={e => setSelectedPic(e.target.value)}
                        className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                        <option value="">— Chưa gán nhân viên —</option>
                        {saleUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex gap-3">
                <button
                    onClick={() => onApprove(customer.id, selectedPic || undefined)}
                    disabled={isProcessing}
                    className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    Duyệt ngay
                </button>
                <button
                    onClick={() => onReject(customer.id)}
                    disabled={isProcessing}
                    className="h-12 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent flex items-center gap-2 transition-all disabled:opacity-60"
                >
                    <XCircle className="w-4 h-4" />
                    Từ chối
                </button>
            </div>
        </div>
    );
}
