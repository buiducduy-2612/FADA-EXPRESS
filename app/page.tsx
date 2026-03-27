"use client";

import {
    ArrowUpRight,
    ArrowDownRight,
    Box,
    Truck,
    Clock,
    AlertTriangle,
    PlaneTakeoff,
    PlaneLanding,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    MoreVertical,
    Search,
    FileCheck,
    CreditCard,
    Users,
    ShieldCheck,
    BarChart3,
    Package
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";

export default function Dashboard() {
    const { t, formatCurr, language } = useLanguage();
    const router = useRouter();
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState("all"); // "today", "week", "month", "all"
    const [currentDate, setCurrentDate] = useState<string | null>(null);
    
    const user = session?.user as any;
    const userRole = user?.role || "SALE";

    useEffect(() => {
        setCurrentDate(formatDate(new Date()));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [resBookings, resCustomers] = await Promise.all([
                    fetch("/api/bookings"),
                    fetch("/api/customers")
                ]);
                if (resBookings.ok) setBookings(await resBookings.json());
                if (resCustomers.ok) setCustomers(await resCustomers.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredBookings = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return bookings.filter(b => {
            const date = new Date(b.createdAt);
            if (filterRange === "today") return date >= startOfDay;
            if (filterRange === "week") return date >= startOfWeek;
            if (filterRange === "month") return date >= startOfMonth;
            return true;
        });
    }, [bookings, filterRange]);

    // Derived Stats
    const stats = useMemo(() => {
        const approvedBookings = filteredBookings.filter(b => b.approvalStatus === "APPROVED");
        const total = filteredBookings.length;
        const revenue = approvedBookings.reduce((acc, b) => acc + (b.totalRevenue || 0), 0);
        const profit = approvedBookings.reduce((acc, b) => acc + ((b.totalRevenue || 0) - (b.totalCost || 0)), 0);
        const active = approvedBookings.filter(b => ["pending", "departed", "in_transit"].includes(b.status)).length;
        const pendingApproval = filteredBookings.filter(b => b.approvalStatus === "PENDING").length;
        const commission = approvedBookings.reduce((acc, b) => acc + (b.commission || 0), 0);

        return { total, revenue, profit, active, pendingApproval, commission };
    }, [filteredBookings]);

    // Customer Performance Stats
    const customerPerformance = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const newCustomersThisMonth = customers.filter(c => new Date(c.createdAt) >= startOfMonth);
        
        const countsByEmployee: Record<string, { count: number, id: string }> = {};
        
        newCustomersThisMonth.forEach(c => {
            const empName = c.personInCharge?.name || c.sales?.name || "Chưa phân công";
            const empId = c.personInChargeId || c.userId || "unassigned";
            
            if (!countsByEmployee[empName]) {
                countsByEmployee[empName] = { count: 0, id: empId };
            }
            countsByEmployee[empName].count++;
        });
        
        return Object.entries(countsByEmployee)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data]) => ({ name, count: data.count }));
    }, [customers]);

    const displayStats = useMemo(() => {
        if (userRole === "SALE") {
            return [
                { label: "Đơn hàng của tôi", value: stats.total, icon: Box, color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Doanh số cá nhân", value: formatCurr(stats.revenue), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Hoa hồng tích lũy", value: formatCurr(stats.commission), icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Đang chờ duyệt", value: stats.pendingApproval, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
            ];
        }
        return [
            { label: "Tổng đơn hàng", value: stats.total, icon: Box, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Tổng doanh thu", value: formatCurr(stats.revenue), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Lợi nhuận gộp", value: formatCurr(stats.profit), icon: BarChart3, color: "text-brand-500", bg: "bg-brand-50" },
            { label: "Cần phê duyệt", value: stats.pendingApproval, icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-50" },
        ];
    }, [userRole, stats, formatCurr]);

    const filterOptions = [
        { label: language === 'vi' ? "Tất cả" : "All", value: "all" },
        { label: language === 'vi' ? "Hôm nay" : "Today", value: "today" },
        { label: language === 'vi' ? "Tuần này" : "This Week", value: "week" },
        { label: language === 'vi' ? "Tháng này" : "This Month", value: "month" },
    ];

    return (
        <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase transition-all">
                        {userRole === "SALE" ? "Bảng điều khiển Sale" : "Tổng quan Hệ thống"}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {currentDate ?? ""} • {userRole} Access
                    </p>
                </div>
                <div className="flex bg-white/50 dark:bg-zinc-800/30 backdrop-blur-xl p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm overflow-x-auto no-scrollbar">
                    {filterOptions.map((opt) => (
                        <button 
                            key={opt.value} 
                            onClick={() => setFilterRange(opt.value)}
                            className={cn(
                                "px-4 py-2 text-[9px] md:text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest whitespace-nowrap", 
                                filterRange === opt.value ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-500 hover:bg-zinc-100"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {displayStats.map((stat, i) => (
                    <div key={i} className="group bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-500", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6 md:w-7 md:h-7", stat.color)} />
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-700">
                            <stat.icon className="w-24 h-24 md:w-32 md:h-32" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Operations Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Khu vực Nghiệp vụ</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Đơn hàng mới nhất ({filterRange})</p>
                            </div>
                            <Link href="/bookings" className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-widest flex items-center gap-1 w-fit">
                                Xem tất cả <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        
                        <div className="space-y-4">
                            {loading ? (
                                <div className="py-10">
                                    <LoadingState 
                                        message={language === 'vi' ? "Đang truy xuất vận đơn..." : "Fetching active bookings..."} 
                                    />
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Package className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Không có đơn hàng nào trong kỳ này</p>
                                </div>
                            ) : filteredBookings.slice(0, 5).map((b) => (
                                <div 
                                    key={b.id} 
                                    onClick={() => router.push(`/bookings/${b.id}`)}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-brand-200 dark:hover:border-brand-500/30 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover:scale-110 transition-transform">
                                            <div className="text-zinc-900 dark:text-white font-black text-xs">{b.reference.slice(-2)}</div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{b.reference}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{formatDate(b.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10">
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white tracking-tighter">{formatCurr(b.totalRevenue)}</p>
                                            <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Expected Rev</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border shrink-0",
                                            b.approvalStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {b.approvalStatus === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white dark:text-zinc-900 shadow-xl relative overflow-hidden group">
                            <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-60">Thao tác nhanh</h4>
                            <p className="text-xl md:text-2xl font-bold tracking-tight mb-6">Tạo vận đơn <br/> hàng không mới</p>
                            <Link href="/bookings/create" className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-600 transition-all group-hover:-translate-y-1">
                                Bắt đầu ngay <ArrowUpRight className="w-4 h-4" />
                            </Link>
                            <Truck className="absolute -right-4 -bottom-4 w-24 h-24 md:w-32 md:h-32 opacity-10 -rotate-12" />
                        </div>
                        <div className="bg-brand-500 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group">
                            <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80 text-white/70">Quản lý khách hàng</h4>
                            <p className="text-xl md:text-2xl font-bold tracking-tight mb-6">Phối hợp & <br/> Gán nhân sự PIC</p>
                            <Link href="/customers" className="inline-flex items-center gap-2 bg-white text-brand-500 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-zinc-50 transition-all group-hover:-translate-y-1">
                                Kiểm tra CRM <Users className="w-4 h-4" />
                            </Link>
                            <Users className="absolute -right-4 -bottom-4 w-24 h-24 md:w-32 md:h-32 opacity-20 -rotate-12" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Finance & Activity */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden p-6 md:p-8">
                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-brand-500" />
                            Quản trị Tài chính
                        </h3>
                        <div className="space-y-6">
                            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Dòng tiền thực thu</p>
                                <p className="text-xl font-bold text-emerald-700 tracking-tight">{formatCurr(stats.revenue)}</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Công nợ hiện hành</p>
                                <p className="text-xl font-bold text-amber-700 tracking-tight">{formatCurr(stats.revenue * 0.4)}</p>
                                <p className="text-[8px] font-bold text-amber-500 uppercase mt-2">* Ước tính 40% chưa thanh toán</p>
                            </div>
                            <Link href="/invoices" className="block w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[10px] font-bold uppercase text-center tracking-widest shadow-lg hover:shadow-2xl transition-all">
                                Chi tiết công nợ
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden p-6 md:p-8">
                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Trạng thái vận hành
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: "Hàng đang bay", value: stats.active, progress: 75, color: "bg-brand-500" },
                                { label: "Đơn chờ duyệt", value: stats.pendingApproval, progress: 40, color: "bg-amber-500" },
                                { label: "Chuyến bay On-time", value: "92%", progress: 92, color: "bg-emerald-500" },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-zinc-400">{item.label}</span>
                                        <span className="text-zinc-900 dark:text-white">{item.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden p-6 md:p-8">
                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-500" />
                            Hiệu suất Sale (Khách mới)
                        </h3>
                        <div className="space-y-4">
                            {customerPerformance.length === 0 ? (
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center py-4">Chưa có khách hàng mới</p>
                            ) : (
                                customerPerformance.slice(0, 5).map((emp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                                                {emp.name[0]}
                                            </div>
                                            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase truncate max-w-[100px]">{emp.name}</span>
                                        </div>
                                        <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[9px] font-bold border border-emerald-100 shrink-0">
                                            {emp.count} Khách
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
