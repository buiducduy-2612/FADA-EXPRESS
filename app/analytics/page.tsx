"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart3, TrendingUp, Users, Package, AlertCircle,
    Target, Zap, DollarSign, Download, Calendar, FileDown,
    Activity, Box, FileText, CheckCircle2
} from "lucide-react";
import LoadingState from "@/components/ui/LoadingState";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line
} from "recharts";

export default function AnalyticsPage() {
    const { formatCurr, language } = useLanguage();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || "SALE";
    const isAdmin = ["ADMIN", "DIRECTOR", "CS", "ACCOUNTING"].includes(userRole);

    const [reportData, setReportData]   = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [activeTab, setActiveTab]     = useState("monthly");
    const [activePreset, setActivePreset] = useState("thisYear");
    const [exporting, setExporting]     = useState(false);

    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
    const [endDate,   setEndDate]   = useState(new Date().toISOString().split("T")[0]);
    const [filterSales, setFilterSales] = useState("");
    const [filterCust,  setFilterCust]  = useState("");

    // Download bookings state
    const [dlStart, setDlStart]   = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
    const [dlEnd,   setDlEnd]     = useState(new Date().toISOString().split("T")[0]);
    const [dlSales, setDlSales]   = useState("");
    const [dlLoading, setDlLoading] = useState(false);

    const [lookups, setLookups] = useState<any>({ sales: [], customers: [] });

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ startDate, endDate, salesId: filterSales, customerId: filterCust });
            const res = await fetch(`/api/reports?${params}`);
            if (res.ok) setReportData(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchLookups = async () => {
        try {
            const [usersRes, custRes] = await Promise.all([fetch("/api/users"), fetch("/api/customers")]);
            if (usersRes.ok && custRes.ok) {
                setLookups({ sales: await usersRes.json(), customers: await custRes.json() });
            }
        } catch {}
    };

    useEffect(() => { fetchReports(); fetchLookups(); }, []);

    const applyQuickDate = (preset: string) => {
        setActivePreset(preset);
        const now = new Date();
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const monday = (d: Date) => { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(new Date(d).setDate(diff)); };
        switch (preset) {
            case "today":     setStartDate(fmt(now)); setEndDate(fmt(now)); break;
            case "yesterday": { const y = new Date(now); y.setDate(y.getDate() - 1); setStartDate(fmt(y)); setEndDate(fmt(y)); break; }
            case "thisWeek":  { const mon = monday(new Date()); setStartDate(fmt(mon)); setEndDate(fmt(now)); break; }
            case "lastWeek":  { const lm = monday(new Date(now)); lm.setDate(lm.getDate() - 7); const ls = new Date(lm); ls.setDate(ls.getDate() + 6); setStartDate(fmt(lm)); setEndDate(fmt(ls)); break; }
            case "thisMonth": { setStartDate(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setEndDate(fmt(now)); break; }
            case "lastMonth": { const lm2 = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lme = new Date(now.getFullYear(), now.getMonth(), 0); setStartDate(fmt(lm2)); setEndDate(fmt(lme)); break; }
            case "thisYear":  setStartDate(fmt(new Date(now.getFullYear(), 0, 1))); setEndDate(fmt(now)); break;
            default: break;
        }
    };

    const handleExcelExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ startDate, endDate, salesId: filterSales });
            const res = await fetch(`/api/reports/export?${params}`);
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url;
            a.download = `FADA_Bao_cao_${startDate}_${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadBookings = async () => {
        setDlLoading(true);
        try {
            const params = new URLSearchParams({ startDate: dlStart, endDate: dlEnd, salesId: dlSales });
            const res = await fetch(`/api/reports/export?${params}`);
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url;
            a.download = `FADA_Don_hang_${dlStart}_${dlEnd}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
        } finally {
            setDlLoading(false);
        }
    };

    const TABS = [
        { id: "monthly",   label: "Doanh thu & Lợi nhuận",   icon: Calendar   },
        { id: "sales",     label: "Lãi lỗ theo Nhân viên",    icon: Users      },
        { id: "customers", label: "Lãi lỗ theo Khách hàng",   icon: Target     },
        { id: "commissions", label: "Hoa hồng chi tiết",      icon: DollarSign },
        { id: "download",  label: "Tải xuống Đơn hàng",       icon: FileDown   },
    ];

    if (!reportData && loading) {
        return <div className="h-[60vh] flex flex-col items-center justify-center"><LoadingState message="Đang tổng hợp báo cáo..." /></div>;
    }

    const totals = reportData?.grandTotals;
    const margin = totals && totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : "0";

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-900/50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <BarChart3 className="w-48 h-48 md:w-64 md:h-64" />
                </div>
                <div className="z-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter uppercase">Trung tâm Phân tích & Báo cáo</h2>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase text-zinc-400 tracking-[0.2em] mt-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                        BI Engine • {formatDate(new Date())}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 z-10">
                    <button
                        onClick={handleExcelExport}
                        disabled={exporting}
                        className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-emerald-600 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-500/20"
                    >
                        {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {exporting ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
                    </button>
                    <button
                        onClick={fetchReports}
                        className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-zinc-900 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all flex items-center gap-2"
                    >
                        <Zap className="w-3.5 h-3.5" /> Làm mới
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900/50 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm space-y-5">
                <div className="flex flex-wrap gap-2 items-center overflow-x-auto no-scrollbar pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mr-2 shrink-0">Lọc nhanh:</span>
                    {[
                        { key: "today", label: "Hôm nay" }, { key: "yesterday", label: "Hôm qua" },
                        { key: "thisWeek", label: "Tuần này" }, { key: "lastWeek", label: "Tuần trước" },
                        { key: "thisMonth", label: "Tháng này" }, { key: "lastMonth", label: "Tháng trước" },
                        { key: "thisYear", label: "Năm nay" },
                    ].map(p => (
                        <button key={p.key} onClick={() => applyQuickDate(p.key)}
                            className={cn("px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                                activePreset === p.key ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100")}>
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className={cn("grid gap-4", isAdmin ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3")}>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Từ ngày</label>
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset("custom"); }}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Đến ngày</label>
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset("custom"); }}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                    </div>
                    {isAdmin && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Nhân viên Sales</label>
                            <select value={filterSales} onChange={e => setFilterSales(e.target.value)}
                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none uppercase tracking-widest">
                                <option value="">Tất cả nhân viên</option>
                                {lookups.sales.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Khách hàng</label>
                        <select value={filterCust} onChange={e => setFilterCust(e.target.value)}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-100 dark:border-zinc-700 outline-none uppercase tracking-widest">
                            <option value="">Tất cả khách hàng</option>
                            {lookups.customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={fetchReports}
                            className="w-full h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4" /> Lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {isAdmin && totals ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-zinc-900 p-6 md:p-8 rounded-[24px] md:rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tổng doanh thu</p>
                        <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-brand-500">{formatCurr(totals.revenue)}</h3>
                        <Box className="absolute right-0 bottom-0 w-20 h-20 opacity-10 -mr-4 -mb-4" />
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lợi nhuận gộp</p>
                        <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-emerald-500">{formatCurr(totals.profit)}</h3>
                        <p className="text-[9px] text-zinc-400 mt-1 font-bold">Biên LN: {margin}%</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hoa hồng</p>
                        <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-orange-500">{formatCurr(totals.commission)}</h3>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Đơn đã duyệt</p>
                        <h3 className="text-lg md:text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white">
                            {reportData?.commissions?.length || 0}
                        </h3>
                    </div>
                </div>
            ) : reportData?.personal ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: "Khách hàng", value: reportData.personal.customers.total, sub: `${reportData.personal.customers.approved} duyệt`, color: "text-brand-500", icon: Users },
                        { label: "Doanh số", value: formatCurr(reportData.personal.revenue), color: "text-indigo-500", icon: TrendingUp },
                        { label: "Hoa hồng", value: formatCurr(reportData.personal.commission), color: "text-emerald-500", icon: DollarSign },
                        { label: "Đơn hàng", value: reportData.personal.shipments, color: "text-amber-500", icon: Package },
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <h3 className={cn("text-lg md:text-2xl font-bold tracking-tighter", s.color)}>{s.value}</h3>
                            {s.sub && <p className="text-[9px] text-zinc-400 mt-1 font-bold">{s.sub}</p>}
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-[24px] md:rounded-[28px] no-scrollbar">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn("flex items-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all font-bold text-[9px] md:text-[10px] uppercase tracking-widest whitespace-nowrap",
                            activeTab === tab.id ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600")}>
                        <tab.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4 mr-2", activeTab === tab.id ? "text-brand-500" : "text-zinc-300")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[48px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm p-6 md:p-10 min-h-[500px]">

                {/* TAB: Monthly */}
                {activeTab === "monthly" && reportData?.monthly && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 h-[300px] md:h-[400px] bg-zinc-50 dark:bg-zinc-800/30 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-700/50">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Doanh thu & Lợi nhuận theo tháng</p>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={[...reportData.monthly].reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }} />
                                        <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "16px", border: "none", background: "#18181b", color: "#fff" }} />
                                        <Bar dataKey="revenue" name="Doanh thu" fill="#0ea5e9" radius={[8, 8, 0, 0]} barSize={30} />
                                        <Bar dataKey="profit"  name="Lợi nhuận" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Tổng lợi nhuận</p>
                                    <h3 className="text-xl md:text-2xl font-bold text-emerald-900 dark:text-emerald-400 tracking-tighter">{formatCurr(reportData.monthly.reduce((a: number, m: any) => a + m.profit, 0))}</h3>
                                </div>
                                <div className="bg-zinc-900 p-6 md:p-8 rounded-[24px] md:rounded-[40px] text-white shadow-xl">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Tổng doanh thu</p>
                                    <h3 className="text-xl md:text-2xl font-bold tracking-tighter">{formatCurr(reportData.monthly.reduce((a: number, m: any) => a + m.revenue, 0))}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-5">Tháng</th>
                                        <th className="px-6 py-5 text-center">Đơn</th>
                                        <th className="px-6 py-5 text-right">Doanh thu</th>
                                        <th className="px-6 py-5 text-right">Chi phí</th>
                                        <th className="px-6 py-5 text-right">Lợi nhuận</th>
                                        <th className="px-6 py-5 text-right">Biên LN %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 font-bold">
                                    {reportData.monthly.map((m: any) => {
                                        const mg = m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : "0";
                                        return (
                                            <tr key={m.month} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-5 text-sm uppercase">{m.month}</td>
                                                <td className="px-6 py-5 text-center text-sm">{m.shipments}</td>
                                                <td className="px-6 py-5 text-right text-sm tabular-nums">{formatCurr(m.revenue)}</td>
                                                <td className="px-6 py-5 text-right text-sm text-zinc-400 tabular-nums">{formatCurr(m.cost)}</td>
                                                <td className="px-6 py-5 text-right text-sm text-emerald-600 tabular-nums font-black">{formatCurr(m.profit)}</td>
                                                <td className="px-6 py-5 text-right text-sm italic tabular-nums">{mg}%</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total row */}
                                    <tr className="bg-zinc-900 text-white">
                                        <td className="px-6 py-5 text-xs font-black uppercase">Tổng cộng</td>
                                        <td className="px-6 py-5 text-center text-xs font-black">{reportData.monthly.reduce((a: number, m: any) => a + m.shipments, 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums font-black">{formatCurr(reportData.monthly.reduce((a: number, m: any) => a + m.revenue, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-zinc-400">{formatCurr(reportData.monthly.reduce((a: number, m: any) => a + m.cost, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-emerald-400 font-black">{formatCurr(reportData.monthly.reduce((a: number, m: any) => a + m.profit, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs italic">{margin}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: P&L by Employee */}
                {activeTab === "sales" && reportData?.sales && (
                    <div className="space-y-8">
                        <div className="overflow-x-auto rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-left min-w-[900px]">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-5">#</th>
                                        <th className="px-6 py-5">Nhân viên</th>
                                        <th className="px-6 py-5 text-center">Tổng đơn</th>
                                        <th className="px-6 py-5 text-center">Đã duyệt</th>
                                        <th className="px-6 py-5 text-right">Doanh thu</th>
                                        <th className="px-6 py-5 text-right">Chi phí</th>
                                        <th className="px-6 py-5 text-right">Lợi nhuận</th>
                                        <th className="px-6 py-5 text-right">Hoa hồng</th>
                                        <th className="px-6 py-5 text-right">Biên LN %</th>
                                        <th className="px-6 py-5 text-center">Tỉ lệ chốt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 font-bold">
                                    {[...reportData.sales].sort((a: any, b: any) => b.revenue - a.revenue).map((s: any, i: number) => {
                                        const mg = s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : "0";
                                        return (
                                            <tr key={s.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                                <td className="px-6 py-5 text-xs text-zinc-400">{i + 1}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-sm uppercase shadow">{s.name[0]}</div>
                                                        <span className="text-sm text-zinc-900 dark:text-white uppercase">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center text-sm tabular-nums">{s.total}</td>
                                                <td className="px-6 py-5 text-center text-sm tabular-nums text-brand-600">{s.accepted}</td>
                                                <td className="px-6 py-5 text-right text-sm tabular-nums">{formatCurr(s.revenue)}</td>
                                                <td className="px-6 py-5 text-right text-sm tabular-nums text-zinc-400">{formatCurr(s.cost)}</td>
                                                <td className="px-6 py-5 text-right text-sm tabular-nums text-emerald-600 font-black">{formatCurr(s.profit)}</td>
                                                <td className="px-6 py-5 text-right text-sm tabular-nums text-orange-500">{formatCurr(s.commission || 0)}</td>
                                                <td className="px-6 py-5 text-right text-sm italic tabular-nums">{mg}%</td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.conversionRate || 0}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-brand-600 w-12 text-right">{(s.conversionRate || 0).toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-zinc-900 text-white">
                                        <td colSpan={2} className="px-6 py-5 text-xs font-black uppercase">Tổng cộng</td>
                                        <td className="px-6 py-5 text-center text-xs font-black">{reportData.sales.reduce((a: number, s: any) => a + s.total, 0)}</td>
                                        <td className="px-6 py-5 text-center text-xs font-black">{reportData.sales.reduce((a: number, s: any) => a + s.accepted, 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs font-black tabular-nums">{formatCurr(reportData.sales.reduce((a: number, s: any) => a + s.revenue, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-zinc-400">{formatCurr(reportData.sales.reduce((a: number, s: any) => a + s.cost, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-emerald-400 font-black">{formatCurr(reportData.sales.reduce((a: number, s: any) => a + s.profit, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-orange-400">{formatCurr(reportData.sales.reduce((a: number, s: any) => a + (s.commission || 0), 0))}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: P&L by Customer */}
                {activeTab === "customers" && reportData?.customers && (
                    <div className="space-y-8">
                        {/* Top 3 summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[...reportData.customers].sort((a: any, b: any) => b.profit - a.profit).slice(0, 3).map((c: any, i: number) => (
                                <div key={c.name} className={cn("p-6 rounded-[24px] border shadow-sm", i === 0 ? "bg-amber-50 border-amber-100" : "bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50")}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg font-black">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase truncate">{c.name}</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-600 tracking-tighter">{formatCurr(c.profit)}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Biên LN: {c.margin}%</p>
                                </div>
                            ))}
                        </div>

                        <div className="overflow-x-auto rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-left min-w-[900px]">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-5">#</th>
                                        <th className="px-6 py-5">Khách hàng</th>
                                        <th className="px-6 py-5 text-center">Số đơn</th>
                                        <th className="px-6 py-5 text-right">Doanh thu</th>
                                        <th className="px-6 py-5 text-right">Chi phí</th>
                                        <th className="px-6 py-5 text-right">Lợi nhuận</th>
                                        <th className="px-6 py-5 text-right">TB/Đơn</th>
                                        <th className="px-6 py-5 text-right">Biên LN %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 font-bold">
                                    {[...reportData.customers].sort((a: any, b: any) => b.revenue - a.revenue).map((c: any, i: number) => (
                                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-5 text-xs text-zinc-400">{i + 1}</td>
                                            <td className="px-6 py-5 text-sm text-zinc-900 dark:text-white uppercase max-w-[220px] truncate">{c.name}</td>
                                            <td className="px-6 py-5 text-center text-sm tabular-nums">{c.shipments}</td>
                                            <td className="px-6 py-5 text-right text-sm text-brand-600 tabular-nums">{formatCurr(c.revenue)}</td>
                                            <td className="px-6 py-5 text-right text-sm text-zinc-400 tabular-nums">{formatCurr(c.cost)}</td>
                                            <td className={cn("px-6 py-5 text-right text-sm tabular-nums font-black", c.profit >= 0 ? "text-emerald-600" : "text-red-500")}>{formatCurr(c.profit)}</td>
                                            <td className="px-6 py-5 text-right text-sm text-zinc-400 tabular-nums">{formatCurr(c.avgShipmentValue)}</td>
                                            <td className="px-6 py-5 text-right text-sm italic tabular-nums">{c.margin}%</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-zinc-900 text-white">
                                        <td colSpan={2} className="px-6 py-5 text-xs font-black uppercase">Tổng cộng</td>
                                        <td className="px-6 py-5 text-center text-xs font-black">{reportData.customers.reduce((a: number, c: any) => a + c.shipments, 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs font-black tabular-nums">{formatCurr(reportData.customers.reduce((a: number, c: any) => a + c.revenue, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-zinc-400">{formatCurr(reportData.customers.reduce((a: number, c: any) => a + c.cost, 0))}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-emerald-400 font-black">{formatCurr(reportData.customers.reduce((a: number, c: any) => a + c.profit, 0))}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: Commission Detail */}
                {activeTab === "commissions" && reportData?.commissions && (
                    <div className="space-y-6">
                        <div className="overflow-x-auto rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-left min-w-[900px]">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-5">Ngày</th>
                                        <th className="px-6 py-5">Mã đơn</th>
                                        <th className="px-6 py-5">Khách hàng</th>
                                        <th className="px-6 py-5">Nhân viên</th>
                                        <th className="px-6 py-5 text-right">Doanh thu</th>
                                        <th className="px-6 py-5 text-right">Chi phí</th>
                                        <th className="px-6 py-5 text-right">Lợi nhuận</th>
                                        <th className="px-6 py-5 text-right">Hoa hồng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 font-bold">
                                    {reportData.commissions.map((c: any, i: number) => (
                                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-5 text-[10px] text-zinc-500 tabular-nums">{formatDate(c.date)}</td>
                                            <td className="px-6 py-5 text-xs uppercase text-zinc-900 dark:text-white">{c.reference}</td>
                                            <td className="px-6 py-5 text-xs text-zinc-500 uppercase max-w-[150px] truncate">{c.customer}</td>
                                            <td className="px-6 py-5 text-xs text-brand-600 uppercase">{c.sales}</td>
                                            <td className="px-6 py-5 text-right text-xs tabular-nums">{formatCurr(c.revenue)}</td>
                                            <td className="px-6 py-5 text-right text-xs tabular-nums text-zinc-400">{formatCurr(c.cost)}</td>
                                            <td className="px-6 py-5 text-right text-xs text-emerald-600 tabular-nums font-black">{formatCurr(c.profit)}</td>
                                            <td className="px-6 py-5 text-right text-xs text-orange-500 font-black tabular-nums">{formatCurr(c.commission)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-zinc-900 text-white">
                                        <td colSpan={4} className="px-6 py-5 text-xs font-black uppercase">Tổng cộng ({reportData.commissions.length} đơn)</td>
                                        <td className="px-6 py-5 text-right text-xs font-black tabular-nums">{formatCurr(reportData.grandTotals?.revenue || 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs tabular-nums text-zinc-400">{formatCurr(reportData.grandTotals?.cost || 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs text-emerald-400 font-black tabular-nums">{formatCurr(reportData.grandTotals?.profit || 0)}</td>
                                        <td className="px-6 py-5 text-right text-xs text-orange-400 tabular-nums">{formatCurr(reportData.grandTotals?.commission || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: Download Bookings */}
                {activeTab === "download" && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                <FileDown className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Tải xuống Đơn hàng</h3>
                            <p className="text-sm text-zinc-500">Xuất toàn bộ dữ liệu đơn hàng ra file Excel chi tiết — bao gồm doanh thu, chi phí, lợi nhuận, hoa hồng từng đơn</p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-[24px] p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Từ ngày</label>
                                    <input type="date" value={dlStart} onChange={e => setDlStart(e.target.value)}
                                        className="w-full h-11 bg-white dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Đến ngày</label>
                                    <input type="date" value={dlEnd} onChange={e => setDlEnd(e.target.value)}
                                        className="w-full h-11 bg-white dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Lọc theo nhân viên (tuỳ chọn)</label>
                                    <select value={dlSales} onChange={e => setDlSales(e.target.value)}
                                        className="w-full h-11 bg-white dark:bg-zinc-800 rounded-2xl px-4 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 outline-none uppercase tracking-widest">
                                        <option value="">Tất cả nhân viên</option>
                                        {lookups.sales.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleDownloadBookings}
                                disabled={dlLoading}
                                className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                            >
                                {dlLoading ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tạo file...</>
                                ) : (
                                    <><Download className="w-5 h-5" /> Tải xuống Excel</>
                                )}
                            </button>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5">
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3">📋 File Excel bao gồm 6 sheet:</p>
                            <ul className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Tổng quan — KPIs tổng hợp</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Theo tháng — Doanh thu, lợi nhuận, hoa hồng</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Lãi lỗ theo Khách hàng — Đầy đủ P&L, biên LN</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Lãi lỗ theo Nhân viên — Từng người, từng chỉ tiêu</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Hoa hồng chi tiết — Từng đơn hàng</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Tất cả đơn hàng — Full data với auto-filter</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
