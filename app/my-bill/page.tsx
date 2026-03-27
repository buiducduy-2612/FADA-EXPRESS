"use client";

import React, { useState, useEffect } from "react";
import { 
    Download, 
    FileSpreadsheet, 
    Search,
    Calendar, 
    Filter, 
    CreditCard, 
    TrendingUp, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    DollarSign,

    Eye,
    ShieldCheck
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useLanguage } from "@/context/LanguageContext";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function MyBillPage() {
    const { formatCurr } = useLanguage();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [settings, setSettings] = useState<any>(null);

    // Filters
    const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
    const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [statusFilter, setStatusFilter] = useState("All");
    const [customerFilter, setCustomerFilter] = useState("All");
    const [salesFilter, setSalesFilter] = useState("All");
    
    const [customers, setCustomers] = useState<any[]>([]);
    const [salesUsers, setSalesUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchBookings();
        fetchSettings();
        fetchFilterData();
    }, []);

    const fetchFilterData = async () => {
        try {
            const [custRes, salesRes] = await Promise.all([
                fetch("/api/customers"),
                fetch("/api/users")
            ]);
            if (custRes.ok) setCustomers(await custRes.json());
            if (salesRes.ok) setSalesUsers(await salesRes.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) setSettings(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/my-bill");
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error("Failed to fetch billed bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const setQuickDate = (type: string) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (type) {
            case "today":
                start = startOfDay(today);
                end = endOfDay(today);
                break;
            case "yesterday":
                start = startOfDay(new Date(today.setDate(today.getDate() - 1)));
                end = endOfDay(today);
                break;
            case "thisWeek":
                start = new Date(today.setDate(today.getDate() - today.getDay()));
                end = endOfDay(new Date());
                break;
            case "lastWeek":
                const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7));
                const lastWeekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                start = lastWeekStart;
                end = lastWeekEnd;
                break;
            case "thisMonth":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = endOfDay(new Date());
                break;
            case "lastMonth":
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case "thisYear":
                start = new Date(today.getFullYear(), 0, 1);
                end = endOfDay(new Date());
                break;
        }

        setFromDate(format(start, "yyyy-MM-dd"));
        setToDate(format(end, "yyyy-MM-dd"));
    };

    const handleExportExcel = async (customerBookings: any[], customer: any) => {
        try {
            const ORANGE  = "FFEA580A";
            const DARK    = "FF0F172A";
            const WHITE   = "FFFFFFFF";
            const LIGHT   = "FFFFF7ED";
            const NC = 13; // total columns

            const workbook = new ExcelJS.Workbook();
            workbook.creator = "FADA EXPRESS";
            workbook.created = new Date();

            const sheet = workbook.addWorksheet("BẢNG KÊ CƯỚC", {
                pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 }
            });

            // ── COLUMN WIDTHS ───────────────────────────────────
            sheet.columns = [
                { width: 5  }, // A: STT
                { width: 13 }, // B: Ngày gửi
                { width: 24 }, // C: AWB / Mã đơn
                { width: 26 }, // D: Người gửi
                { width: 22 }, // E: Tuyến bay
                { width: 12 }, // F: TL cước
                { width: 16 }, // G: Cước vận chuyển
                { width: 14 }, // H: Phụ phí
                { width: 14 }, // I: Phí phát sinh
                { width: 18 }, // J: Tổng doanh thu
                { width: 16 }, // K: Đã thanh toán
                { width: 16 }, // L: Còn lại
                { width: 13 }, // M: Tình trạng
            ];

            // ── HELPER: fill entire row with color ──────────────
            const fillRow = (r: number, argb: string, h = 15) => {
                sheet.getRow(r).height = h;
                for (let c = 1; c <= NC; c++) {
                    sheet.getRow(r).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
                }
            };
            // HELPER: set a label+value pair in 2-col layout
            const infoRow = (row: number, labelCol: number, label: string, valueEndCol: number, value: string, height = 16) => {
                sheet.getRow(row).height = height;
                const lc = sheet.getRow(row).getCell(labelCol);
                lc.value = label;
                lc.font = { name: "Arial", bold: true, size: 9, color: { argb: ORANGE } };
                lc.alignment = { vertical: "middle" };
                sheet.mergeCells(row, labelCol + 1, row, valueEndCol);
                const vc = sheet.getRow(row).getCell(labelCol + 1);
                vc.value = value;
                vc.font = { name: "Arial", size: 9 };
                vc.alignment = { vertical: "middle" };
            };

            // ── ROW 1-2: HEADER BAND ────────────────────────────
            fillRow(1, ORANGE, 20);
            fillRow(2, ORANGE, 30);
            fillRow(3, ORANGE, 14);
            fillRow(4, ORANGE, 13);

            // Try embed logo in A1:B4
            try {
                const logoRes = await fetch("/fada-logo.png");
                if (logoRes.ok) {
                    const buf = await logoRes.arrayBuffer();
                    const imgId = workbook.addImage({ buffer: buf, extension: "png" });
                    sheet.addImage(imgId, { tl: { col: 0, row: 0 }, br: { col: 2, row: 4 }, editAs: "oneCell" } as any);
                }
            } catch (_) { /* logo optional */ }

            // Company name + report title
            sheet.mergeCells("C1:M1");
            Object.assign(sheet.getCell("C1"), {
                value: settings?.companyName || "CÔNG TY TNHH FADA LOGISTICS",
                font: { name: "Arial", bold: true, size: 11, color: { argb: WHITE } },
                alignment: { vertical: "middle", horizontal: "left" },
            });
            sheet.mergeCells("C2:M2");
            Object.assign(sheet.getCell("C2"), {
                value: "BẢNG KÊ CHI TIẾT CƯỚC VẬN CHUYỂN HÀNG KHÔNG",
                font: { name: "Arial", bold: true, size: 15, color: { argb: WHITE } },
                alignment: { vertical: "middle", horizontal: "left" },
            });
            sheet.mergeCells("C3:M3");
            Object.assign(sheet.getCell("C3"), {
                value: `${settings?.companyAddress || ""} | MST: ${settings?.companyTaxCode || "3703354696"} | Tel: ${settings?.companyPhone || "0795.6666.72"}`,
                font: { name: "Arial", size: 8.5, color: { argb: "FFFED7AA" } },
                alignment: { vertical: "middle", horizontal: "left" },
            });
            sheet.mergeCells("C4:M4");
            Object.assign(sheet.getCell("C4"), {
                value: `Email: ${settings?.companyEmail || "atus@fadalogisticsvn.com"} | Ngày xuất: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
                font: { name: "Arial", size: 8, italic: true, color: { argb: "FFFDE68A" } },
                alignment: { vertical: "middle", horizontal: "left" },
            });

            // ── ROW 5: spacer ───────────────────────────────────
            sheet.getRow(5).height = 8;

            // ── ROWS 6-12: CUSTOMER INFO BLOCK ─────────────────
            // Left column: customer info (cols 1-6), Right column: period/stats (cols 8-13)
            const custName    = customer?.name    || "—";
            const custAddr    = customer?.address || "—";
            const custPhone   = customer?.phone   || "—";
            const custEmail   = customer?.email   || "—";
            const custTax     = customer?.taxCode || "—";
            const custContact = customer?.contact || "—";

            // Section header background
            fillRow(6, LIGHT, 13);
            sheet.mergeCells("A6:F6");
            Object.assign(sheet.getCell("A6"), {
                value: "THÔNG TIN KHÁCH HÀNG",
                font: { name: "Arial", bold: true, size: 9, color: { argb: ORANGE } },
                alignment: { vertical: "middle", horizontal: "left" },
            });
            sheet.mergeCells("H6:M6");
            Object.assign(sheet.getCell("H6"), {
                value: "THÔNG TIN CHỨNG TỪ",
                font: { name: "Arial", bold: true, size: 9, color: { argb: ORANGE } },
                alignment: { vertical: "middle", horizontal: "left" },
            });

            infoRow(7,  1, "CÔNG TY:",      6, custName,    18);
            infoRow(8,  1, "ĐỊA CHỈ:",      6, custAddr,    15);
            infoRow(9,  1, "ĐIỆN THOẠI:",   6, custPhone,   15);
            infoRow(10, 1, "EMAIL:",         6, custEmail,   15);
            infoRow(11, 1, "MST:",           6, custTax,     15);
            infoRow(12, 1, "NGƯỜI LIÊN HỆ:", 6, custContact, 15);

            // Right side: period + booking count
            infoRow(7,  8, "KHOẢNG THỜI GIAN:", 13, `${fromDate} → ${toDate}`, 18);
            infoRow(8,  8, "SỐ ĐƠN HÀNG:",      13, `${customerBookings.length} vận đơn`, 15);
            infoRow(9,  8, "NHÂN VIÊN SALE:",    13, customerBookings[0]?.sales?.name || "—", 15);
            infoRow(10, 8, "SỐ HOÁ ĐƠN:",        13, customerBookings.map((b: any) => b.invoices?.[0]?.invoiceNo).filter(Boolean).join(", ") || "—", 15);

            // ── ROW 13: spacer ──────────────────────────────────
            sheet.getRow(13).height = 6;

            // ── ROW 14: TABLE HEADER ────────────────────────────
            const HDR_ROW = 14;
            sheet.getRow(HDR_ROW).height = 32;
            const tableHeaders = [
                "STT", "NGÀY GỬI", "MÃ VẬN ĐƠN / AWB", "NGƯỜI GỬI",
                "TUYẾN BAY", "TL CƯỚC (KG)", "CƯỚC VẬN CHUYỂN",
                "PHỤ PHÍ / DV", "PHÍ PHÁT SINH", "TỔNG DOANH THU",
                "ĐÃ THANH TOÁN", "CÒN LẠI", "TÌNH TRẠNG",
            ];
            tableHeaders.forEach((h, i) => {
                const cell = sheet.getRow(HDR_ROW).getCell(i + 1);
                cell.value = h;
                cell.font = { name: "Arial", bold: true, size: 8.5, color: { argb: WHITE } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                cell.border = {
                    top: { style: "thin" }, bottom: { style: "thin" },
                    left: { style: "thin" }, right: { style: "thin" },
                };
            });

            // ── DATA ROWS ───────────────────────────────────────
            let r = HDR_ROW + 1;
            let totalRev = 0, totalPaid = 0, totalLeft = 0;
            const safeDate = (d: any) => {
                try { const dt = new Date(d); return isNaN(dt.getTime()) ? "" : format(dt, "dd/MM/yyyy"); }
                catch { return ""; }
            };

            customerBookings.forEach((b: any, idx: number) => {
                const paid    = Number(b.amountPaid    || 0);
                const revenue = Number(b.totalRevenue  || 0);
                const left    = Math.max(0, revenue - paid);
                const rowBg   = idx % 2 === 0 ? "FFF8FAFC" : WHITE;

                const row = sheet.getRow(r);
                row.height = 17;

                const vals = [
                    idx + 1,
                    safeDate(b.shipDate || b.createdAt),
                    b.awbNumber || b.reference || "",
                    b.senderName || "",
                    `${b.origin || ""}${b.destination ? " → " + b.destination : ""}`,
                    Number(b.chargeableWeight || 0),
                    Number(b.freightRevenue   || 0),
                    Number(b.surcharge        || 0),
                    Number(b.otherFees        || 0),
                    revenue,
                    paid,
                    left,
                    b.paymentStatus === "PAID" ? "Đã TT" : b.paymentStatus === "PARTIAL" ? "1 phần" : "Chưa TT",
                ];

                vals.forEach((v, i) => {
                    const col  = i + 1;
                    const cell = row.getCell(col);
                    cell.value = v;
                    cell.font  = { name: "Arial", size: 9 };
                    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
                    cell.border = {
                        top: { style: "hair" }, bottom: { style: "hair" },
                        left: { style: "hair" }, right: { style: "hair" },
                    };
                    cell.alignment = { vertical: "middle", horizontal: "center" };

                    // numbers → right-align + format
                    if ([6, 7, 8, 9, 10, 11, 12].includes(col)) {
                        cell.numFmt    = "#,##0";
                        cell.alignment = { vertical: "middle", horizontal: "right" };
                    }
                    // text columns → left-align
                    if ([3, 4, 5].includes(col)) {
                        cell.alignment = { vertical: "middle", horizontal: "left" };
                    }
                    // status color
                    if (col === 13) {
                        const s = b.paymentStatus;
                        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: s === "PAID" ? "FF16A34A" : s === "PARTIAL" ? "FFB45309" : "FFDC2626" } };
                    }
                    // remaining → red if > 0
                    if (col === 12 && left > 0) {
                        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFDC2626" } };
                    }
                });

                totalRev  += revenue;
                totalPaid += paid;
                totalLeft += left;
                r++;
            });

            // ── TOTAL ROW ────────────────────────────────────────
            sheet.getRow(r).height = 22;
            sheet.mergeCells(r, 1, r, 9);
            const totLabel = sheet.getRow(r).getCell(1);
            totLabel.value = "TỔNG CỘNG THANH TOÁN (TOTAL AMOUNT)";
            totLabel.font  = { name: "Arial", bold: true, size: 10, color: { argb: "FFFFD700" } };
            totLabel.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
            totLabel.alignment = { vertical: "middle", horizontal: "right" };
            totLabel.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "thin" }, right: { style: "thin" } };

            ([
                [10, totalRev,  "FFFFD700"],
                [11, totalPaid, "FF86EFAC"],
                [12, totalLeft, "FFFCA5A5"],
                [13, "",        DARK      ],
            ] as [number, any, string][]).forEach(([col, val, color]) => {
                const cell = sheet.getRow(r).getCell(col);
                if (val !== "") {
                    cell.value  = val;
                    cell.numFmt = "#,##0";
                    cell.font   = { name: "Arial", bold: true, size: 10, color: { argb: color } };
                }
                cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
                cell.alignment = { vertical: "middle", horizontal: "right" };
                cell.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "thin" }, right: { style: "thin" } };
            });

            // ── SIGNATURES ───────────────────────────────────────
            r += 2;
            sheet.getRow(r).height = 14;
            sheet.mergeCells(r, 2, r, 5);
            Object.assign(sheet.getRow(r).getCell(2), {
                value: "NGƯỜI LẬP BIỂU",
                font: { name: "Arial", bold: true, size: 9 },
                alignment: { horizontal: "center" },
            });
            sheet.mergeCells(r, 9, r, 13);
            Object.assign(sheet.getRow(r).getCell(9), {
                value: "ĐẠI DIỆN KHÁCH HÀNG",
                font: { name: "Arial", bold: true, size: 9 },
                alignment: { horizontal: "center" },
            });

            r += 4;
            sheet.getRow(r).height = 13;
            sheet.mergeCells(r, 2, r, 5);
            Object.assign(sheet.getRow(r).getCell(2), {
                value: "(Ký, ghi rõ họ tên)",
                font: { name: "Arial", italic: true, size: 8, color: { argb: "FF94A3B8" } },
                alignment: { horizontal: "center" },
            });
            sheet.mergeCells(r, 9, r, 13);
            Object.assign(sheet.getRow(r).getCell(9), {
                value: "(Ký tên, đóng dấu xác nhận)",
                font: { name: "Arial", italic: true, size: 8, color: { argb: "FF94A3B8" } },
                alignment: { horizontal: "center" },
            });

            // ── FOOTER STRIPE ────────────────────────────────────
            r += 2;
            fillRow(r, ORANGE, 12);
            Object.assign(sheet.getRow(r).getCell(1), {
                value: `FADA EXPRESS  |  ${settings?.companyPhone || "0795.6666.72"}  |  ${settings?.companyEmail || "atus@fadalogisticsvn.com"}`,
                font: { name: "Arial", bold: true, size: 8, color: { argb: WHITE } },
                alignment: { vertical: "middle", horizontal: "center" },
            });
            sheet.mergeCells(r, 1, r, NC);

            // ── WRITE FILE ───────────────────────────────────────
            const buffer = await workbook.xlsx.writeBuffer();
            const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const safeName = (customer?.name || "FADA").replace(/[^\p{L}\p{N}]/gu, "_").slice(0, 40);
            saveAs(blob, `FADA_BangKe_${safeName}_${format(new Date(), "ddMMyyyy")}.xlsx`);
        } catch (error) {
            console.error("Excel Export Error:", error);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch = 
            b.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.invoices?.[0]?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const date = new Date(b.createdAt);
        const matchesDate = isWithinInterval(date, {
            start: startOfDay(new Date(fromDate)),
            end: endOfDay(new Date(toDate))
        });
        
        const matchesStatus = statusFilter === "All" || b.paymentStatus === statusFilter;
        const matchesCustomer = customerFilter === "All" || b.customerId === customerFilter;
        const matchesSales = salesFilter === "All" || b.salesId === salesFilter;
        
        return matchesSearch && matchesDate && matchesStatus && matchesCustomer && matchesSales;
    });

    const stats = {
        totalRevenue: filteredBookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0),
        paid: filteredBookings.filter(b => b.paymentStatus === "PAID").reduce((sum, b) => sum + (b.totalRevenue || 0), 0),
        unpaid: filteredBookings.filter(b => b.paymentStatus === "UNPAID").reduce((sum, b) => sum + (b.totalRevenue || 0), 0),
        dueIn5Days: filteredBookings.filter(b => {
             if (b.paymentStatus === "PAID") return false;
             const shipDate = b.shipDate || b.createdAt;
             const diff = (new Date(shipDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
             return diff >= 0 && diff <= 5;
        }).length
    };

    return (
        <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight uppercase">Quản lý Công nợ</h2>
                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-brand-500" />
                        Professional Financial Billing & Collections
                    </p>
                </div>
                <div className="flex items-center gap-3">
                     <button 
                        onClick={() => handleExportExcel(filteredBookings, { name: "Filtered_Report" })}
                        className="h-10 md:h-11 px-4 md:px-6 rounded-xl bg-emerald-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Xuất Báo cáo
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[9px] md:text-[10px] font-bold text-brand-500 uppercase tracking-widest flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" /> Bộ lọc Công nợ
                    </h3>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { label: "Hôm nay", type: "today" },
                            { label: "Hôm qua", type: "yesterday" },
                            { label: "Tuần này", type: "thisWeek" },
                            { label: "Tuần trước", type: "lastWeek" },
                            { label: "Tháng này", type: "thisMonth" },
                            { label: "Tháng trước", type: "lastMonth" },
                            { label: "Năm nay", type: "thisYear" },
                        ].map((btn) => (
                            <button 
                                key={btn.type}
                                onClick={() => setQuickDate(btn.type)}
                                className="px-4 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-brand-500 hover:text-white transition-all border border-zinc-100 dark:border-zinc-700"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Từ Ngày</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input 
                                    type="date" 
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 pl-11 pr-4 text-xs font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Đến Ngày</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input 
                                    type="date" 
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 pl-11 pr-4 text-xs font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Khách hàng</label>
                            <select 
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                                className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 px-6 text-xs font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 transition-all outline-none"
                            >
                                <option value="All">Tất cả khách hàng</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nhân viên Sale</label>
                            <select 
                                value={salesFilter}
                                onChange={(e) => setSalesFilter(e.target.value)}
                                className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 px-6 text-xs font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 transition-all outline-none"
                            >
                                <option value="All">Tất cả Sale</option>
                                {salesUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Trạng thái</label>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 px-6 text-xs font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-500 transition-all outline-none"
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value="PAID">Đã thanh toán</option>
                                <option value="UNPAID">Chưa thanh toán</option>
                                <option value="PARTIAL">Thanh toán một phần</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                    { label: "HẠN MỨC", value: "100.000.000 VNĐ", icon: ShieldCheck, color: "text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" },
                    { label: "SẮP ĐẾN HẠN (5 NGÀY)", value: `${stats.dueIn5Days} đơn hàng`, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    { label: "TIỀN SẮP VỀ", value: "0 VNĐ", icon: DollarSign, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/20" },
                    { label: "TỔNG DOANH THU", value: formatCurr(stats.totalRevenue), icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50 dark:bg-blue-900/20" },
                    { label: "ĐÃ THANH TOÁN", value: formatCurr(stats.paid), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { label: "CHƯA THANH TOÁN", value: formatCurr(stats.unpaid), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between group hover:border-brand-300 transition-all">
                        <div className="space-y-1">
                            <p className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                            <p className={cn("text-lg md:text-xl font-bold tracking-tight", stat.color)}>{stat.value}</p>
                        </div>
                        <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                            <stat.icon className={cn("w-5 h-5 md:w-6 md:h-6", stat.color)} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Debit List Table */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm min-h-[400px]">
                <div className="p-6 md:p-8 border-b border-zinc-50 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <Clock className="w-4 h-4 text-brand-500" />
                        Danh sách Công nợ
                    </h3>
                    <div className="relative w-full md:w-80 shadow-sm rounded-xl overflow-hidden">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nhanh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 w-full bg-zinc-50 dark:bg-zinc-800/50 pl-11 pr-4 text-[10px] font-bold text-zinc-900 dark:text-white border-none focus:ring-0 uppercase tracking-widest"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto select-none rounded-b-[24px] md:rounded-b-[40px]">
                    <table className="w-full text-left min-w-[720px]">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Thời gian</th>
                                <th className="px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Mã Đơn / AWB</th>
                                <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Số Hóa đơn</th>
                                <th className="px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Khách hàng</th>
                                <th className="hidden lg:table-cell px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Sale PIC</th>
                                <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                                <th className="px-4 md:px-6 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-[10px] font-semibold text-zinc-300 animate-pulse">
                                        Đang tải dữ liệu công nợ...
                                    </td>
                                </tr>
                            ) : filteredBookings.map((b) => (
                                <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                            </div>
                                            <span className="text-[10px] font-semibold text-zinc-500 whitespace-nowrap">{format(new Date(b.createdAt), "dd/MM/yy")}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-900 dark:text-white group-hover:text-brand-500 transition-colors whitespace-nowrap">{b.reference}</span>
                                            {b.awbNumber && <span className="text-[9px] text-zinc-400 mt-0.5 font-semibold">{b.awbNumber}</span>}
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 md:px-6 py-4">
                                        <span className="text-[10px] font-semibold text-zinc-500">{b.invoices?.[0]?.invoiceNo || "—"}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-[10px] shrink-0">
                                                {b.customer?.name?.[0]}
                                            </div>
                                            <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] md:max-w-none">{b.customer?.name}</span>
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 md:px-6 py-4">
                                        <span className="text-[10px] font-semibold text-zinc-500">{b.sales?.name || "—"}</span>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 md:px-6 py-4">
                                        {(() => {
                                            const status = b.paymentStatus;
                                            const cfg = status === "PAID"
                                                ? { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" }
                                                : status === "PARTIAL"
                                                ? { label: "Còn nợ", cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/10" }
                                                : { label: "Chưa thanh toán", cls: "bg-rose-50 text-rose-600 dark:bg-rose-500/10" };
                                            return <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>;
                                        })()}
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button 
                                                onClick={() => handleExportExcel([b], b.customer)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shrink-0"
                                                title="Xuất Excel"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => window.location.href = `/bookings/${b.id}`}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 transition-all shrink-0"
                                                title="Xem đơn"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredBookings.length === 0 && (
                    <div className="py-24 text-center">
                        <FileSpreadsheet className="w-16 h-16 text-zinc-100 dark:text-zinc-800 mx-auto mb-4" />
                        <p className="text-sm font-medium text-zinc-300">Không có dữ liệu công nợ phù hợp với bộ lọc</p>
                    </div>
                )}
            </div>
        </div>
    );
}
