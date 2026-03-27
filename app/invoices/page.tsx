"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    CreditCard,
    Search,
    Plus,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Printer,
    BarChart3,
    ChevronRight,
    MoreVertical,
    Box,
    FileText,
    ShieldCheck,
    Send,
    Download,
    TrendingUp,
    Filter,
    Calendar,
    Building2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { useSession } from "next-auth/react";

export default function DebtManagementPage() {
    const { t, formatCurr } = useLanguage();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Filters state
    const [filterCustomer, setFilterCustomer] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const user = session?.user as any;
    const userRole = user?.role || "SALE";

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterCustomer !== "all") params.append("customerId", filterCustomer);
            if (filterStatus !== "all") params.append("status", filterStatus);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await fetch(`/api/invoices?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterCustomer, filterStatus, startDate, endDate]);

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/bookings");
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    useEffect(() => {
        fetchCustomers();
        fetchBookings();
    }, []);

    // Form state for new invoice
    const [formData, setFormData] = useState({
        invoiceNo: `INV-${new Date().getTime().toString().slice(-6)}`,
        bookingId: "",
        amount: 0,
        currency: "VND",
        status: "unpaid",
        dueDate: ""
    });

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === "amount" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            };

            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({
                    invoiceNo: `INV-${new Date().getTime().toString().slice(-6)}`,
                    bookingId: "",
                    amount: 0,
                    currency: "VND",
                    status: "unpaid",
                    dueDate: ""
                });
                fetchInvoices();
                showToast("success", "Đã tạo hóa đơn ghi sổ thành công!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        const headers = ["Invoice No", "Customer", "Booking Ref", "Amount", "Currency", "Status", "Due Date", "Created At"];
        const rows = invoices.map(inv => [
            inv.invoiceNo,
            inv.booking?.customer?.name || "Unknown",
            inv.booking?.reference || "N/A",
            inv.amount,
            inv.currency,
            inv.status,
            inv.dueDate ? formatDate(inv.dueDate) : "N/A",
            formatDate(inv.createdAt)
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_cao_cong_no_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportSOA = async (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const custInvoices = invoices.filter(inv => inv.booking?.customerId === customerId);
        const totalDebt = custInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = custInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
        const balance = totalDebt - totalPaid;

        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("STATEMENT OF ACCOUNT");

        // Set column widths
        sheet.columns = [
            { width: 15 }, // Ref
            { width: 12 }, // Date
            { width: 25 }, // Description
            { width: 15 }, // Amount
            { width: 15 }, // Paid
            { width: 15 }, // Balance
            { width: 12 }, // Status
        ];

        // Header style
        const titleRow = sheet.getRow(1);
        titleRow.values = ["BÁO CÁO CHI TIẾT CÔNG NỢ - " + customer.name.toUpperCase()];
        titleRow.font = { name: 'Arial', size: 14, bold: true };
        sheet.mergeCells('A1:G1');
        titleRow.alignment = { horizontal: 'center' };

        // Customer Info
        sheet.addRow(["Khách hàng:", customer.name]);
        sheet.addRow(["Liên hệ:", customer.contact || "N/A"]);
        sheet.addRow(["Ngày xuất:", formatDate(new Date())]);
        sheet.addRow([]);

        // Table Header
        const headerRow = sheet.addRow(["Số Chứng Từ", "Ngày Ghi", "Diễn Giải", "Số Tiền (VND)", "Đã Trả (VND)", "Còn Nợ (VND)", "Trạng Thái"]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0f172a' } };
            cell.alignment = { horizontal: 'center' };
        });

        // Data Rows
        custInvoices.forEach(inv => {
            const row = sheet.addRow([
                inv.invoiceNo,
                formatDate(inv.createdAt),
                inv.booking?.reference + " - " + inv.booking?.origin + " to " + inv.booking?.destination,
                inv.amount,
                inv.status === 'paid' ? inv.amount : 0,
                inv.status === 'paid' ? 0 : inv.amount,
                inv.status.toUpperCase()
            ]);
            row.getCell(4).numFmt = '#,##0';
            row.getCell(5).numFmt = '#,##0';
            row.getCell(6).numFmt = '#,##0';
            row.alignment = { vertical: 'middle' };
        });

        // Footer Summary
        sheet.addRow([]);
        const totalRow = sheet.addRow(["", "", "TỔNG CỘNG:", totalDebt, totalPaid, balance, ""]);
        totalRow.font = { bold: true };
        totalRow.getCell(4).numFmt = '#,##0';
        totalRow.getCell(5).numFmt = '#,##0';
        totalRow.getCell(6).numFmt = '#,##0';

        const buffer = await workbook.xlsx.writeBuffer();
        const saveAs = (await import("file-saver")).saveAs;
        saveAs(new Blob([buffer]), `SOA_${customer.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.booking?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);
        const totalOutstanding = bookings.reduce((sum, b) => sum + ((b.totalRevenue || 0) - (b.amountPaid || 0)), 0);
        const totalCommission = bookings.reduce((sum, b) => sum + (b.commission || 0), 0);
        const paidToday = invoices
            .filter(inv => inv.status === "paid" && new Date(inv.paidDate || inv.updatedAt).toDateString() === new Date().toDateString())
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        return { 
            total: totalRevenue, 
            unpaid: totalOutstanding, 
            commission: totalCommission, 
            paidToday: paidToday 
        };
    }, [bookings, invoices]);

    const [activeView, setActiveView] = useState<"invoices" | "customers">("invoices");
    
    const customerBalances = useMemo(() => {
        return customers.map(c => {
            const bookings = c.bookings || [];
            const revenue = bookings.reduce((sum: number, b: any) => sum + (b.totalRevenue || 0), 0);
            const paid = bookings.reduce((sum: number, b: any) => sum + (b.amountPaid || 0), 0);
            return {
                ...c,
                totalRevenue: revenue,
                totalPaid: paid,
                balance: revenue - paid
            };
        }).sort((a, b) => b.balance - a.balance);
    }, [customers]);

    const handleUpdateInvoiceStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, paidDate: newStatus === 'paid' ? new Date().toISOString() : null })
            });
            if (res.ok) {
                showToast("success", "Cập nhật trạng thái hóa đơn thành công");
                fetchInvoices();
                fetchBookings(); // To sync balances
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight uppercase">Quản lý Tài chính</h2>
                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                        Ghi sổ & Theo dõi Công nợ Đối tác
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400 shadow-sm hover:bg-zinc-50 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </button>
                    {(userRole === "ADMIN" || userRole === "ACCOUNTING" || userRole === "DIRECTOR") && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-10 md:h-12 px-6 md:px-8 rounded-xl md:rounded-2xl bg-zinc-900 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-brand-600 transition-all flex items-center gap-2 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            <span>Tạo Hóa Đơn</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Tổng khoản phải thu", value: formatCurr(stats.total), icon: DollarSign, color: "text-zinc-900", bg: "bg-zinc-50" },
                    { label: "Chưa thanh toán", value: formatCurr(stats.unpaid), icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Hoa hồng Sale (35%)", value: formatCurr(stats.commission), icon: TrendingUp, color: "text-brand-500", bg: "bg-brand-50" },
                    { label: "Đã thu hôm nay", value: formatCurr(stats.paidToday), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between hover:shadow-2xl transition-all relative group overflow-hidden">
                        <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6 md:w-7 md:h-7", stat.color)} />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-700">
                             <CreditCard className="w-24 h-24 md:w-32 md:h-32" />
                        </div>
                    </div>
                ))}
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveView("invoices")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        activeView === "invoices" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                    )}
                >
                    Danh sách Hóa đơn
                </button>
                <button 
                    onClick={() => setActiveView("customers")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        activeView === "customers" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                    )}
                >
                    Số dư Khách hàng
                </button>
            </div>

            {activeView === "invoices" ? (
                <>
                    {/* Filters */}
                    <div className="bg-white dark:bg-zinc-900/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                        <div className="relative group w-full lg:flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm chứng từ, khách hàng..."
                                className="h-11 md:h-12 w-full rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 pl-11 pr-4 text-[9px] md:text-[10px] font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white focus:border-brand-300 focus:outline-none transition-all uppercase tracking-widest"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select 
                                value={filterCustomer} 
                                onChange={(e) => setFilterCustomer(e.target.value)}
                                className="flex-1 lg:flex-none px-4 py-3 text-[9px] md:text-[10px] font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 border border-transparent rounded-xl md:rounded-2xl focus:outline-none uppercase tracking-widest"
                            >
                                <option value="all">Khách hàng</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 lg:flex-none px-4 py-3 text-[9px] md:text-[10px] font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 border border-transparent rounded-xl md:rounded-2xl focus:outline-none uppercase tracking-widest"
                            >
                                <option value="all">Trạng thái</option>
                                <option value="unpaid">Chưa thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="overdue">Quá hạn</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto no-scrollbar select-none">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] border-b border-zinc-50 dark:border-zinc-800">
                                        <th className="px-8 py-6">Mã HD & Ngày ghi</th>
                                        <th className="px-8 py-6">Khách hàng</th>
                                        <th className="px-8 py-6">Mã đơn gốc</th>
                                        <th className="px-8 py-6 text-right">Số tiền (VNĐ)</th>
                                        <th className="px-8 py-6 text-right">Hoa hồng Sale</th>
                                        <th className="px-8 py-6 text-center">Trạng thái</th>
                                        <th className="px-8 py-6 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Đang trích xuất sổ phụ tài chính...</td></tr>
                                    ) : filteredInvoices.map((inv) => (
                                        <tr key={inv.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                        <FileText className="w-6 h-6 text-zinc-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{inv.invoiceNo}</span>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{formatDate(inv.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-200 flex items-center justify-center text-[10px] text-white dark:text-zinc-900 font-bold uppercase tracking-tighter shrink-0 ring-4 ring-zinc-50 dark:ring-zinc-800">
                                                        {inv.booking?.customer?.name?.[0] || 'C'}
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px] uppercase tracking-tight">{inv.booking?.customer?.name || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Link href={`/bookings/${inv.bookingId}`} className="text-[10px] font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all">
                                                    {inv.booking?.reference}
                                                </Link>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tighter">{formatCurr(inv.amount)}</span>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Hạn: {inv.dueDate ? formatDate(inv.dueDate) : "N/A"}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-bold text-brand-600">{formatCurr(inv.booking?.commission || 0)}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                        inv.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            inv.status === "overdue" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {inv.status !== 'paid' && (
                                                        <button 
                                                            onClick={() => handleUpdateInvoiceStatus(inv.id, 'paid')}
                                                            className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                            title="Đánh dấu đã thu tiền"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {customerBalances.map(cb => (
                        <div key={cb.id} className="bg-white dark:bg-zinc-900/50 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:border-brand-300 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-lg font-bold">
                                        {cb.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{cb.name}</h4>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{cb.taxCode || 'No Tax Code'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleExportSOA(cb.id)}
                                    className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-brand-500 transition-colors"
                                    title="Export Statement of Account"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4 py-6 border-y border-zinc-50 dark:border-zinc-800/50 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tổng phát sinh</span>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurr(cb.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Đã thanh toán</span>
                                    <span className="text-sm font-bold text-emerald-500">{formatCurr(cb.totalPaid)}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Dư nợ hiện tại</p>
                                    <p className={cn(
                                        "text-xl font-bold tracking-tighter",
                                        cb.balance > 0 ? "text-rose-500" : "text-emerald-500"
                                    )}>
                                        {formatCurr(cb.balance)}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setFilterCustomer(cb.id);
                                        setActiveView("invoices");
                                    }}
                                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-brand-600 transition-colors"
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Invoice Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Ghi sổ Hóa đơn Chứng từ"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField id="invoiceNo" label="Số hóa đơn (Invoice ID)" value={formData.invoiceNo} onChange={handleChange} required />
                        <FormField
                            id="bookingId"
                            label="Đơn hàng liên kết"
                            value={formData.bookingId}
                            onChange={handleChange}
                            required
                            options={[
                                { label: "-- Chọn vận đơn --", value: "" },
                                ...bookings.map(b => ({ label: `${b.reference} (${b.customer?.name})`, value: b.id }))
                            ]}
                        />
                        <FormField id="amount" label="Số tiền thanh toán" type="number" value={formData.amount} onChange={handleChange} required />
                        <FormField id="dueDate" label="Hạn thanh toán dự kiến" type="date" value={formData.dueDate} onChange={handleChange} />
                        <FormField
                            id="status"
                            label="Trạng thái ban đầu"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            options={[
                                { label: "Chưa thanh toán", value: "unpaid" },
                                { label: "Đã thanh toán", value: "paid" },
                                { label: "Quá hạn (Overdue)", value: "overdue" }
                            ]}
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-900 transition-colors">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-10 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:bg-brand-600 transition-all disabled:opacity-50">
                            Xác nhận ghi sổ tài chính
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
