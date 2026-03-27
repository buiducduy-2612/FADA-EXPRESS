"use client";

import {
    Package,
    Search,
    Plus,
    ChevronRight,
    Globe,
    Truck,
    Trash2,
    ShieldCheck,
    CreditCard,
    ArrowUpRight,
    PlaneLanding,
    Users,
    Box,
    SlidersHorizontal,
    X,
    Calendar
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/forms/BookingForm";

export default function BookingsPage() {
    const { t, formatCurr } = useLanguage();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingData, setEditingData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tất cả");
    const [showAdvFilter, setShowAdvFilter] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");

    const user = session?.user as any;
    const userRole = user?.role || "SALE";

    useEffect(() => {
        fetchBookings();
        fetchCustomers();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bookings");
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (err) {
            console.error("Failed to fetch customers:", err);
        }
    };

    const handleEdit = (booking: any) => {
        router.push(`/bookings/${booking.id}/edit`);
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Xác nhận duyệt đơn hàng này?")) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approvalStatus: "APPROVED" }),
            });
            if (res.ok) fetchBookings();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xác nhận xóa vận đơn này?")) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
            if (res.ok) fetchBookings();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const url = editingData ? `/api/bookings/${editingData.id}` : "/api/bookings";
            const method = editingData ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setEditingData(null);
                fetchBookings();
                showToast("success", "Lưu thông tin thành công!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const activeFilterCount = [fromDate, toDate, customerFilter].filter(Boolean).length;
    const clearAdvFilters = () => { setFromDate(""); setToDate(""); setCustomerFilter(""); };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.awbNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === "Chờ duyệt") matchesStatus = b.approvalStatus === "PENDING";
        else if (statusFilter === "Đã duyệt") matchesStatus = b.approvalStatus === "APPROVED";
        else if (statusFilter === "Hoàn thành") matchesStatus = b.status === "delivered";

        let matchesDate = true;
        if (fromDate || toDate) {
            const date = new Date(b.shipDate || b.createdAt);
            if (fromDate) matchesDate = date >= new Date(fromDate);
            if (toDate && matchesDate) matchesDate = date <= new Date(toDate + "T23:59:59");
        }

        const matchesCustomer = !customerFilter || b.customerId === customerFilter;

        return matchesSearch && matchesStatus && matchesDate && matchesCustomer;
    });

    return (
        <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight uppercase">Hệ thống Vận đơn</h2>
                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <Package className="w-3 h-3 text-brand-500" />
                        Quản lý Báo giá & Lô hàng Air Logistics
                    </p>
                </div>
                <button
                    onClick={() => router.push('/bookings/create')}
                    className="h-10 md:h-12 px-6 md:px-8 rounded-xl md:rounded-2xl bg-zinc-900 text-white text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center space-x-3 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Tạo mới đơn hàng</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-4">
                    <div className="relative group w-full lg:flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã đơn, vận đơn AWB, khách hàng..." 
                            className="h-11 md:h-12 w-full rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 pl-11 pr-4 text-[9px] md:text-[10px] font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-300 focus:outline-none transition-all uppercase tracking-widest" 
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-0 no-scrollbar w-full lg:w-auto">
                        {["Tất cả", "Chờ duyệt", "Đã duyệt", "Hoàn thành"].map((f) => (
                            <button 
                                key={f} 
                                onClick={() => setStatusFilter(f)}
                                className={cn(
                                    "px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap transition-all flex-1 lg:flex-none text-center",
                                    statusFilter === f ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg" : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-100 dark:border-zinc-700 hover:border-brand-200"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowAdvFilter(v => !v)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] font-bold uppercase tracking-widest border whitespace-nowrap transition-all relative shrink-0",
                                showAdvFilter ? "bg-brand-500 text-white border-brand-500 shadow-lg" : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-100 dark:border-zinc-700 hover:border-brand-200"
                            )}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Lọc</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                {showAdvFilter && (
                    <div className="border-t border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 px-4 md:px-6 py-4 md:py-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal className="w-3 h-3" /> Bộ lọc nâng cao
                            </p>
                            {activeFilterCount > 0 && (
                                <button onClick={clearAdvFilters} className="text-[9px] font-bold text-zinc-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    <X className="w-3 h-3" /> Xóa lọc
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Từ ngày</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                        className="h-10 w-full rounded-xl bg-white dark:bg-zinc-800 pl-9 pr-3 text-xs font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Đến ngày</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                        className="h-10 w-full rounded-xl bg-white dark:bg-zinc-800 pl-9 pr-3 text-xs font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Khách hàng</label>
                                <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
                                    className="h-10 w-full rounded-xl bg-white dark:bg-zinc-800 px-3 text-xs font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                                    <option value="">Tất cả khách hàng</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {activeFilterCount > 0 && (
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                Hiển thị <span className="text-brand-500">{filteredBookings.length}</span> trong tổng số {bookings.length} đơn hàng
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Bookings List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu nghiệp vụ...</div>
                ) : filteredBookings.map((b) => (
                    <div 
                        key={b.id} 
                        onClick={() => router.push(`/bookings/${b.id}`)}
                        className="group bg-white dark:bg-zinc-900/50 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 p-6 md:p-8 shadow-sm hover:shadow-2xl hover:border-brand-100 transition-all duration-500 flex flex-col relative overflow-hidden cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 group-hover:scale-110 group-hover:border-brand-100 transition-all duration-500">
                                    <Truck className="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
                                </div>
                                 <div>
                                    <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tighter uppercase group-hover:text-brand-600 transition-colors">{b.reference}</h3>
                                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 group-hover:text-emerald-500 uppercase tracking-widest transition-colors">{b.awbNumber || "CHƯA CẬP NHẬT AWB"}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 md:gap-2">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider border",
                                    b.approvalStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                )}>
                                    {b.approvalStatus === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                                </span>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider border",
                                    b.paymentStatus === "PAID" ? "bg-orange-50 text-orange-500 border-orange-100" : "bg-zinc-50 text-zinc-500 border-zinc-100"
                                )}>
                                    {b.paymentStatus}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-[20px] md:rounded-3xl p-5 md:p-6 mb-6 md:mb-8 border border-zinc-100 dark:border-zinc-700/30">
                            <div>
                                <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Hành trình</p>
                                <p className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white uppercase truncate">{b.origin} <ChevronRight className="w-2.5 h-2.5 inline text-zinc-300" /> {b.destination}</p>
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5 flex items-center gap-1.5"><Box className="w-3 h-3" /> Quy cách</p>
                                <p className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">{b.chargeableWeight} KG <span className="text-[9px] opacity-60">({b.cargoType || "N/A"})</span></p>
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5 flex items-center gap-1.5"><Users className="w-3 h-3" /> Đối tác</p>
                                <p className="text-[11px] md:text-xs font-bold text-zinc-900 dark:text-white truncate">{b.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Tổng doanh thu</p>
                                <p className="text-xs md:text-sm font-bold text-brand-600">{formatCurr(b.totalRevenue)}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-5 md:pt-6 border-t border-zinc-100 dark:border-zinc-800/50 relative z-10">
                            <div className="flex items-center gap-2">
                                {(userRole === "DIRECTOR" || userRole === "CS" || userRole === "ADMIN") && b.approvalStatus === "PENDING" && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleApprove(b.id); }}
                                        className="h-9 md:h-10 px-4 md:px-6 rounded-xl bg-emerald-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Duyệt đơn
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(b); }} className="p-2 md:p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg md:rounded-xl transition-all"><Edit2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="p-2 md:p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg md:rounded-xl transition-all"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                <div className="p-2 md:p-2.5 text-zinc-400 group-hover:text-brand-500 group-hover:bg-brand-50 rounded-lg md:rounded-xl transition-all"><ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /></div>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-700">
                            <PlaneLanding className="w-32 h-32 md:w-48 md:h-48" />
                        </div>
                    </div>
                ))}
                {filteredBookings.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-zinc-300 font-bold uppercase tracking-widest">Không tìm thấy đơn hàng nào khớp yêu cầu</div>
                )}
            </div>


        </div>
    );
}

// Internal Edit2 icon helper
function Edit2(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    );
  }
