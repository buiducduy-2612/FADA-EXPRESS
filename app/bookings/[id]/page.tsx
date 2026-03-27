"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Plane, 
    Globe, 
    Package, 
    CreditCard, 
    Clock, 
    CheckCircle2, 
    AlertTriangle,
    FileText,
    Truck,
    Navigation,
    Calendar,
    User,
    Mail,
    FileDown,
    XCircle,
    History,
    Activity,
    PlusCircle,
    Eye,
    EyeOff,
    Printer,
    Edit2,
    MapPin,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import LoadingState from "@/components/ui/LoadingState";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import BookingForm from "@/components/forms/BookingForm";
import CarrierTrackingWidget from "@/components/tracking/CarrierTrackingWidget";

export default function BookingDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t, formatCurr, language } = useLanguage();
    const { showToast } = useToast();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    
    // Custom UI Dialogs
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [showEmailPreview, setShowEmailPreview] = useState(false);

    const fetchBooking = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/bookings/${id}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
            } else {
                console.error("Failed to fetch booking");
            }
        } catch (err) {
            console.error(err);
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
            console.error(err);
        }
    };
    
    const fetchActivities = async () => {
        try {
            setLoadingActivities(true);
            const res = await fetch(`/api/bookings/${id}/activities`);
            if (res.ok) setActivities(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingActivities(false);
        }
    };
    
    useEffect(() => {
        if (id) {
            fetchBooking();
            fetchCustomers();
            fetchActivities();
        }
    }, [id]);

    const handleEditSave = async (formData: any) => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchBooking();
                showToast("success", "Cập nhật thông tin thành công!");
            } else {
                const err = await res.json();
                showToast("error", `Lỗi: ${err.error || "Không thể lưu thay đổi"}`);
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Có lỗi xảy ra khi lưu thông tin");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendEmail = () => {
        const defaultEmail = booking.customer?.email || "";
        setEmailInput(defaultEmail);
        setIsEmailModalOpen(true);
    };

    const confirmSendEmail = async () => {
        const emails = emailInput.split(",").map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            showToast("error", "Vui lòng nhập ít nhất một email hợp lệ.");
            return;
        }

        setSendingEmail(true);
        try {
            const res = await fetch(`/api/bookings/${id}/send-invoice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emails })
            });
            if (res.ok) {
                setIsEmailModalOpen(false);
                showToast("success", "Đã gửi email hoá đơn thành công!");
            } else {
                const err = await res.json();
                showToast("error", `Lỗi: ${err.error || "Không thể gửi email"}`);
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Có lỗi xảy ra khi gửi email");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const res = await fetch(`/api/bookings/${id}/download-invoice`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Invoice_${booking.reference}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                showToast("error", language === 'vi' ? "Không thể tải hoá đơn" : "Could not download invoice");
            }
        } catch (err) {
            console.error(err);
            showToast("error", language === 'vi' ? "Có lỗi xảy ra khi tải hoá đơn" : "Error downloading invoice");
        }
    };

    const handlePrintInvoice = async () => {
        try {
            const res = await fetch(`/api/bookings/${id}/download-invoice`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                showToast("error", language === 'vi' ? "Không thể thực hiện in" : "Could not open print window");
            }
        } catch (err) {
            console.error(err);
            showToast("error", language === 'vi' ? "Có lỗi xảy ra" : "An error occurred");
        }
    };

    if (loading && !booking) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <LoadingState message={language === 'vi' ? "Đang truy xuất thông tin vận đơn..." : "Retrieving booking details..."} />
            </div>
        );
    }

    if (!booking && !loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-amber-500" />
                <div className="text-center">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Không tìm thấy vận đơn</h3>
                    <p className="text-zinc-500 text-sm mt-2">Mã vận đơn không tồn tại hoặc bạn không có quyền truy cập.</p>
                </div>
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 overflow-hidden relative">
            {/* Top Navigation */}
            <div className="flex flex-col gap-6">
                <button 
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all font-bold uppercase tracking-widest text-[9px] md:text-[10px] w-fit"
                >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-zinc-400">
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </div>
                    Quay lại danh sách
                </button>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <button 
                        onClick={handlePrintInvoice}
                        className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 bg-brand-500 text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Printer className="w-4 h-4" /> {t("common.print_invoice")}
                    </button>
                    <button 
                        onClick={handleDownloadInvoice}
                        className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <FileDown className="w-4 h-4" /> {t("common.download_invoice")}
                    </button>
                    <button 
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                    >
                        <Mail className="w-4 h-4" /> {sendingEmail ? "..." : (language === 'vi' ? "Gửi" : "Send")}
                    </button>
                    <button 
                        onClick={() => router.push(`/bookings/${booking.id}/edit`)}
                        className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-zinc-800 transition-all active:scale-95 border border-zinc-700 whitespace-nowrap"
                    >
                        <Edit2 className="w-4 h-4" /> {t("common.edit")}
                    </button>
                    <span className={cn(
                        "w-full md:w-auto text-center px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border shadow-sm",
                        booking.approvalStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                        {booking.approvalStatus === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                </div>
            </div>

            {/* Header Hero Section */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[48px] border border-zinc-100 dark:border-zinc-800/50 p-6 md:p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 md:p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <Plane className="w-48 h-48 md:w-64 md:h-64" />
                </div>
                <div className="z-10 relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-500 text-white px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Booking ID</span>
                            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter uppercase">{booking.reference}</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-500" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{booking.origin}</span>
                                <Navigation className="w-2.5 h-2.5 rotate-90" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{booking.destination}</span>
                            </div>
                            <div className="hidden md:block w-1.5 h-1.5 bg-zinc-200 rounded-full"></div>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{formatDate(booking.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                         <div className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 items-center flex gap-2">
                             <User className="w-3.5 h-3.5" /> Phụ trách:
                         </div>
                         <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-2 pr-4 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-zinc-700/50 w-fit">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-[10px]">
                                {booking.sales?.name?.[0] || 'U'}
                            </div>
                            <span className="text-[11px] md:text-sm font-bold text-zinc-900 dark:text-white uppercase">{booking.sales?.name || 'Unassigned'}</span>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Information */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 md:p-8 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                            <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <FileText className="w-4 h-4 text-brand-500" />
                                Thông tin nghiệp vụ
                            </h3>
                        </div>
                        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-y-10 md:gap-x-12">
                            <div className="space-y-1.5">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Khách hàng / Partner</label>
                                <p className="text-base md:text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{booking.customer?.name || 'N/A'}</p>
                                <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium">{booking.customer?.email || 'No email'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Số HBL/AWB</label>
                                <p className="text-base md:text-lg font-bold text-brand-600 uppercase tracking-tight">{booking.awbNumber || 'PENDING'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Người gửi (Shipper)</label>
                                <p className="text-base md:text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{booking.senderName || booking.shipper || 'N/A'}</p>
                                {booking.senderAddress && (
                                    <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium leading-relaxed">
                                        {booking.senderPhone && <span>Tel: {booking.senderPhone}<br/></span>}
                                        {booking.senderAddress}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Người nhận (Consignee)</label>
                                <p className="text-base md:text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{booking.recipientName || 'N/A'}</p>
                                {(booking.recipientAddress || booking.recipientCity) && (
                                    <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium leading-relaxed">
                                        {booking.recipientPhone && <span>Tel: {booking.recipientPhone}<br/></span>}
                                        {booking.recipientAddress}, {booking.recipientCity}, {booking.recipientCountry}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hàng hóa & Dịch vụ</label>
                                <p className="text-base md:text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{booking.cargoType || 'General Cargo'}</p>
                                <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{booking.service || 'Standard Service'}</p>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1.5 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                                <label className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Mô tả chi tiết</label>
                                <p className="text-[11px] md:text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                                    {booking.description || "Không có mô tả chi tiết cho vận đơn này."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Package List Detail */}
                    {booking.packages && booking.packages.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/50 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                    <Package className="w-4 h-4 text-orange-500" />
                                    Chi tiết kiện hàng ({booking.packages.length})
                                </h3>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                                            <th className="px-8 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Loại</th>
                                            <th className="px-4 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Trọng lượng</th>
                                            <th className="px-4 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Kích thước (D x R x C)</th>
                                            <th className="px-4 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Thể tích</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                        {booking.packages.map((pkg: any, idx: number) => (
                                            <tr key={pkg.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                                <td className="px-8 py-4 font-bold text-xs uppercase">{pkg.packagingType}</td>
                                                <td className="px-4 py-4 text-xs font-bold">{pkg.weight} KG</td>
                                                <td className="px-4 py-4 text-xs text-zinc-500">{pkg.length} x {pkg.width} x {pkg.height} cm</td>
                                                <td className="px-4 py-4 text-xs text-zinc-500">{((Number(pkg.length || 0) * Number(pkg.width || 0) * Number(pkg.height || 0)) / 6000).toFixed(2)} KG (Vol)</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 md:p-8 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30">
                            <h3 className="text-[10px] md:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Truck className="w-4 h-4 text-emerald-500" />
                                Vận hành & Cập nhật
                            </h3>
                        </div>
                        <div className="p-6 md:p-10">
                            <div className="flex items-center justify-between mb-8 md:mb-12 relative px-4">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2 z-0"></div>
                                {[ 
                                    { step: "SGN", icon: Globe, status: "completed" },
                                    { step: "AIR", icon: Plane, status: "active" },
                                    { step: "SIN", icon: MapPin, status: "pending" },
                                ].map((item, i) => (
                                    <div key={i} className="z-10 bg-white dark:bg-zinc-900 p-1 md:p-2 rounded-full ring-4 md:ring-8 ring-white dark:ring-zinc-900">
                                        <div className={cn(
                                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-xl",
                                            item.status === "completed" ? "bg-emerald-500 text-white" : 
                                            item.status === "active" ? "bg-brand-500 text-white animate-pulse" : 
                                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                        )}>
                                            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50">
                                    <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Ngày đi dự kiến (ETD)
                                    </p>
                                    <p className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">{booking.etd ? formatDate(booking.etd) : 'N/A'}</p>
                                </div>
                                <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50">
                                    <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" /> Ngày đến dự kiến (ETA)
                                    </p>
                                    <p className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">{booking.eta ? formatDate(booking.eta) : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Live Carrier Tracking */}
                            {booking.awbNumber ? (
                                <CarrierTrackingWidget
                                    awbNumber={booking.awbNumber}
                                    bookingId={booking.id}
                                    onDelivered={() => {
                                        fetchBooking();
                                        fetchActivities();
                                        showToast("success", "🎉 Đơn hàng đã được giao! Trạng thái đã cập nhật tự động.");
                                    }}
                                />
                            ) : (
                                <div className="mt-6 p-4 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Chưa có mã AWB — Cập nhật AWB để bật tính năng tracking trực tiếp từ hãng vận chuyển
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lateral Section: Stats & Financials */}
                <div className="space-y-8">
                    {/* Weight & Volume */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm p-8 overflow-hidden relative">
                        <Package className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 -rotate-12 text-brand-500" />
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Package className="w-4 h-4 text-amber-500" />
                            Kích thước & Quy cách
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Tổng số kiện</p>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{booking.pieces} <span className="text-[10px] opacity-40 uppercase">Pcs</span></p>
                                </div>
                                <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full w-[60%]"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end pt-6 border-t border-zinc-50 dark:border-zinc-800">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Khối lượng tính cước</p>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{booking.chargeableWeight} <span className="text-[10px] opacity-40 uppercase">Kg</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Trọng lượng thực</p>
                                    <p className="text-sm font-bold text-zinc-500">{booking.weight} KG</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Thể tích tổng (CBM)</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{booking.volume} <span className="text-[10px] opacity-40 uppercase">m³</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl shadow-zinc-900/40 relative overflow-hidden group">
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-brand-500" />
                            Định mức Tài chính
                        </h3>
                        <div className="space-y-8 relative z-10">
                            <div>
                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tổng doanh thu dự kiến</p>
                                <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter text-brand-500 break-all">{formatCurr(booking.totalRevenue)}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border",
                                        booking.paymentStatus === "PAID" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                                        booking.paymentStatus === "PARTIAL" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    )}>
                                        {booking.paymentStatus}
                                    </span>
                                    {booking.paymentStatus === "PARTIAL" && booking.amountPaid > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-400">
                                            Đã TT: {formatCurr(booking.amountPaid)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Giá vốn đầu vào</p>
                                    <p className="text-sm font-bold">{formatCurr(booking.totalCost)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Lợi nhuận gộp</p>
                                    <p className="text-sm font-bold text-emerald-400">{formatCurr(booking.totalRevenue - booking.totalCost)}</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                Xem chi tiết hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order History Timeline - Moved to bottom for mobile/responsive optimization */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col mt-8">
                <div className="p-8 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <History className="w-4 h-4 text-brand-500" />
                        Lịch sử xử lý đơn hàng
                    </h3>
                    {loadingActivities && <span className="text-[10px] font-bold text-zinc-400 animate-pulse">ĐANG TẢI...</span>}
                </div>
                <div className="p-10">
                    {activities.length === 0 && !loadingActivities ? (
                        <div className="text-center py-10">
                            <Activity className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chưa có ghi nhận lịch sử cho đơn hàng này</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
                            {activities.map((act: any, idx: number) => (
                                <div key={act.id} className="relative pl-12 group">
                                    <div className={cn(
                                        "absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center z-10 border-4 border-white dark:border-zinc-900 transition-all group-hover:scale-110 shadow-sm",
                                        act.action === "CREATE" ? "bg-emerald-500 text-white" :
                                        act.action === "UPDATE" ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {act.action === "CREATE" ? <PlusCircle className="w-5 h-5" /> : 
                                         act.action === "UPDATE" ? <Edit2 className="w-4 h-4" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
                                                {act.action === "CREATE" ? "Khởi tạo đơn hàng" : 
                                                 act.action === "UPDATE" ? "Cập nhật thông tin" : "Xóa đơn hàng"}
                                            </p>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{formatDate(act.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[8px] font-bold shadow-sm">
                                                {act.user?.name?.[0] || 'U'}
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Thực hiện bởi: {act.user?.name} ({act.user?.role})</span>
                                        </div>
                                        {act.details && act.action === "UPDATE" && (
                                            <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Chi tiết thay đổi:</p>
                                                <div className="space-y-3">
                                                    {(() => {
                                                        try {
                                                            const details = JSON.parse(act.details);
                                                            const keyMapping: Record<string, string> = {
                                                                freightRevenue: "Cước vận chuyển",
                                                                surcharge: "Phụ phí / Dịch vụ",
                                                                otherFees: "Phí phát sinh khác",
                                                                otherFeeLabel: "Tên phí phát sinh",
                                                                totalRevenue: "Tổng doanh thu",
                                                                totalCost: "Giá vốn đầu vào",
                                                                commission: "Hoa hồng",
                                                                status: "Trạng thái đơn hàng",
                                                                paymentStatus: "Tình trạng thanh toán",
                                                                amountPaid: "Số tiền đã thanh toán",
                                                                origin: "Điểm đi",
                                                                destination: "Điểm đến",
                                                                cargoType: "Tính chất hàng hóa",
                                                                service: "Dịch vụ hàng không",
                                                                shipDate: "Ngày khởi hành",
                                                                etd: "Ngày đi dự kiến (ETD)",
                                                                eta: "Ngày đến dự kiến (ETA)",
                                                                senderName: "Tên người gửi",
                                                                senderAddress: "Địa chỉ người gửi",
                                                                senderPhone: "SDT người gửi",
                                                                recipientName: "Tên người nhận",
                                                                recipientAddress: "Địa chỉ người nhận",
                                                                recipientPhone: "SDT người nhận",
                                                                description: "Ghi chú",
                                                                awbNumber: "Mã vận đơn (AWB)",
                                                                reference: "Mã tham chiếu",
                                                                packages: "Thông tin kiện hàng",
                                                                pieces: "Tổng số kiện",
                                                                weight: "Trọng lượng thực",
                                                                volume: "Thể tích",
                                                                chargeableWeight: "Khối lượng tính cước",
                                                                salesId: "Nhân viên phụ trách",
                                                                customerId: "Khách hàng"
                                                            };
                                                            
                                                            const formatVal = (k: string, v: any) => {
                                                                if (v === null || v === undefined) return 'N/A';
                                                                if (['freightRevenue', 'surcharge', 'otherFees', 'totalRevenue', 'totalCost', 'commission', 'amountPaid'].includes(k)) {
                                                                    return formatCurr(Number(v));
                                                                }
                                                                if (typeof v === 'object') return 'Đã thay đổi chi tiết';
                                                                return String(v);
                                                            };

                                                            return Object.entries(details).filter(([k]) => k !== 'updatedAt').map(([key, val]: any) => (
                                                                <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                                                    <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.2em]">{keyMapping[key] || key}</span>
                                                                    <div className="flex items-center gap-3 text-[10px] font-bold">
                                                                        <span className="text-zinc-400 line-through">{formatVal(key, val.old)}</span>
                                                                        <ChevronRight className="w-3 h-3 text-zinc-300" />
                                                                        <span className="text-zinc-900 dark:text-white">{formatVal(key, val.new)}</span>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        } catch (e) {
                                                            return null;
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Email Modal */}
            <Modal
                isOpen={isEmailModalOpen}
                onClose={() => {
                    setIsEmailModalOpen(false);
                    setShowEmailPreview(false);
                }}
                title={language === 'vi' ? "Gửi Hoá Đơn" : "Send Invoice"}
                maxWidth="max-w-3xl"
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">{language === 'vi' ? "Email người nhận" : "Recipient Emails"}</label>
                            <textarea
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="email1@domain.com, email2@domain.com"
                                rows={2}
                                className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                            />
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2">
                                {language === 'vi' ? "*Ngăn cách nhiều email bằng dấu phẩy" : "*Separate multiple emails with commas"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <button 
                            onClick={() => setShowEmailPreview(!showEmailPreview)}
                            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-brand-500 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {language === 'vi' ? "Xem trước nội dung email" : "Preview Email Content"}
                            </span>
                            {showEmailPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {showEmailPreview && (
                            <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                                        <Plane className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Từ: Fada Logistics</p>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Tiêu đề: [THÔNG BÁO] Lô hàng #{booking.reference} đã khởi tạo</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                    <p>Xin chào quý khách,</p>
                                    <p>Chúng tôi xin gửi tới bạn thông tin chi tiết về lô hàng mới được khởi tạo trên hệ thống <strong>Fada Air Logistics</strong>:</p>
                                    
                                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-400 uppercase font-black">Mã vận đơn (AWB):</span>
                                            <span className="text-zinc-900 dark:text-white font-black">{booking.awbNumber || "PENDING"}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-400 uppercase font-black">Hành trình:</span>
                                            <span className="text-zinc-900 dark:text-white font-black">{booking.origin} → {booking.destination}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-400 uppercase font-black">Tổng số kiện:</span>
                                            <span className="text-zinc-900 dark:text-white font-black">{booking.pieces} PCS</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-400 uppercase font-black">Trạng thái:</span>
                                            <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded text-[9px] font-black">MỚI KHỞI TẠO</span>
                                        </div>
                                    </div>

                                    <p>Bạn có thể theo dõi hành trình của mình trực tiếp trên ứng dụng của chúng tôi.</p>
                                    <p>Trân trọng,<br/><strong>Bộ phận vận hành Fada Logistics</strong></p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => {
                                setIsEmailModalOpen(false);
                                setShowEmailPreview(false);
                            }}
                            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all order-2 sm:order-1"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={confirmSendEmail}
                            disabled={sendingEmail}
                            className="px-8 py-3 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-600 shadow-2xl shadow-brand-500/20 flex items-center justify-center gap-3 disabled:opacity-50 order-1 sm:order-2 w-full sm:w-auto transition-all active:scale-95"
                        >
                            {sendingEmail ? <Mail className="w-5 h-5 animate-bounce" /> : <Mail className="w-5 h-5 transition-transform group-hover:rotate-12" />}
                            {language === 'vi' ? "Gửi Email ngay" : "Send Email Now"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
