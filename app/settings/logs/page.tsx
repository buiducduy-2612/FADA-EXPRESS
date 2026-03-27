"use client";

import React, { useState, useEffect } from "react";
import {
    Database, Search, RefreshCw, Filter, ChevronLeft,
    User, Package, Users, FileText, Settings, Shield,
    AlertCircle, CheckCircle, Clock, Trash2, Edit2,
    Plus, Download, Eye, LogIn, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ACTION_ICONS: Record<string, any> = {
    CREATE: Plus, UPDATE: Edit2, DELETE: Trash2, VIEW: Eye,
    LOGIN: LogIn, LOGOUT: LogOut, APPROVE: CheckCircle, REJECT: AlertCircle,
    SEND: FileText, EXPORT: Download,
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    VIEW:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    LOGIN:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    LOGOUT: "bg-zinc-100 text-zinc-600",
    APPROVE:"bg-emerald-100 text-emerald-700",
    REJECT: "bg-orange-100 text-orange-700",
    SEND:   "bg-sky-100 text-sky-700",
    EXPORT: "bg-violet-100 text-violet-700",
};

const ENTITY_ICONS: Record<string, any> = {
    booking: Package, customer: Users, invoice: FileText,
    user: User, role: Shield, setting: Settings,
    lead: Users, flight: Package,
};

const ENTITY_LABELS: Record<string, string> = {
    booking: "Đơn hàng", customer: "Khách hàng", invoice: "Hoá đơn",
    user: "Nhân sự", role: "Phân quyền", setting: "Cài đặt",
    lead: "Lead", flight: "Chuyến bay",
};

function timeAgo(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SystemLogsPage() {
    const [logs, setLogs]         = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [entityFilter, setEntityFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [page, setPage]         = useState(1);
    const [total, setTotal]       = useState(0);
    const PER_PAGE = 50;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search, entity: entityFilter, action: actionFilter,
                page: String(page), limit: String(PER_PAGE)
            });
            const res = await fetch(`/api/activity?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : (data.logs || []));
                setTotal(data.total || (Array.isArray(data) ? data.length : 0));
            }
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [entityFilter, actionFilter, page]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchLogs(); };

    const grouped = logs.reduce((acc: Record<string, any[]>, log) => {
        const dateKey = new Date(log.createdAt).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(log);
        return acc;
    }, {});

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/settings" className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:bg-zinc-200 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Nhật ký hệ thống</h2>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Activity Log — {total} sự kiện được ghi nhận
                        </p>
                    </div>
                </div>
                <button onClick={fetchLogs} className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-600 transition-all">
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
            </div>

            {/* Search + Filters */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 p-5 space-y-4">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm theo tên người dùng, đối tượng..."
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl pl-11 pr-4 text-sm border border-zinc-100 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                    <button type="submit" className="h-11 px-6 rounded-2xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-600 transition-all">
                        Tìm
                    </button>
                </form>

                <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Đối tượng</label>
                        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                            className="h-9 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none uppercase tracking-widest">
                            <option value="all">Tất cả</option>
                            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Hành động</label>
                        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                            className="h-9 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none uppercase tracking-widest">
                            <option value="all">Tất cả</option>
                            {Object.keys(ACTION_COLORS).map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Log Feed */}
            <div className="space-y-6">
                {loading ? (
                    <div className="h-60 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center bg-white dark:bg-zinc-900/50 rounded-[28px] border border-zinc-100 dark:border-zinc-800/50">
                        <Database className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Chưa có nhật ký nào</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, dateLogs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap px-2">{date}</span>
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>

                            <div className="bg-white dark:bg-zinc-900/50 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-50 dark:divide-zinc-800 overflow-hidden">
                                {(dateLogs as any[]).map((log) => {
                                    const ActionIcon = ACTION_ICONS[log.action] || CheckCircle;
                                    const EntityIcon = ENTITY_ICONS[log.entityType] || Package;
                                    const actionColor = ACTION_COLORS[log.action] || "bg-zinc-100 text-zinc-600";
                                    const entityLabel = ENTITY_LABELS[log.entityType] || log.entityType;

                                    let details: any = {};
                                    try { details = JSON.parse(log.details || "{}"); } catch { }

                                    return (
                                        <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-sm uppercase flex-shrink-0 shadow-sm">
                                                {log.user?.name?.[0] || "S"}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{log.user?.name || "System"}</span>
                                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", actionColor)}>
                                                        <ActionIcon className="w-3 h-3" />
                                                        {log.action}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                                        <EntityIcon className="w-3 h-3" />
                                                        {entityLabel}
                                                    </span>
                                                    {log.entityId && (
                                                        <span className="text-[9px] font-mono text-zinc-400">#{log.entityId.slice(-8)}</span>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                {details.description && (
                                                    <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{details.description}</p>
                                                )}
                                                {details.changes && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {Object.entries(details.changes).slice(0, 5).map(([k, v]: any) => (
                                                            <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono text-zinc-500">
                                                                {k}: <span className="text-zinc-700 dark:text-zinc-300">{String(v).slice(0, 30)}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {log.user?.role && (
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">{log.user.role}</span>
                                                )}
                                            </div>

                                            {/* Time */}
                                            <div className="text-right flex-shrink-0">
                                                <span className="text-[10px] text-zinc-400 font-bold">{timeAgo(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {total > PER_PAGE && (
                <div className="flex items-center justify-center gap-3 pb-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="h-10 px-5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-sm font-bold disabled:opacity-40 hover:bg-zinc-50 transition-all">
                        ← Trước
                    </button>
                    <span className="text-sm font-bold text-zinc-500">Trang {page} / {Math.ceil(total / PER_PAGE)}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
                        className="h-10 px-5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 text-sm font-bold disabled:opacity-40 hover:bg-zinc-50 transition-all">
                        Sau →
                    </button>
                </div>
            )}
        </div>
    );
}
