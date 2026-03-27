"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Box,
    TrendingUp,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Edit2,
    X,
    ShieldCheck,
    UserCircle,
    Star,
    Crown,
    Target,
    History,
    ArrowRight
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function CustomerDetailsPage() {
    const { id } = useParams() as { id: string };
    const { t, formatCurr } = useLanguage();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const router = useRouter();

    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [picHistory, setPicHistory] = useState<any[]>([]);
    const [picHistoryLoading, setPicHistoryLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        contact: "",
        industry: "",
        taxCode: "",
        status: "active",
        tier: "POTENTIAL",
        personInChargeId: ""
    });

    const currentUser = session?.user as any;

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/customers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCustomer(data);
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    contact: data.contact || "",
                    industry: data.industry || "",
                    taxCode: data.taxCode || "",
                    status: data.status || "active",
                    tier: data.tier || "POTENTIAL",
                    personInChargeId: data.personInChargeId || ""
                });
            } else {
                console.error("Failed to fetch customer");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (currentUser?.role !== "DIRECTOR" && currentUser?.role !== "ADMIN") return;
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPICHistory = async () => {
        setPicHistoryLoading(true);
        try {
            const res = await fetch(`/api/customers/${id}/pic-history`);
            if (res.ok) setPicHistory(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setPicHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCustomer();
            fetchUsers();
            fetchPICHistory();
        }
    }, [id, currentUser?.role]);

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchCustomer();
                fetchPICHistory();
                showToast("success", "Cập nhật thành công!");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm("Phê duyệt khách hàng này?")) return;
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: true }),
            });
            if (res.ok) fetchCustomer();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignPIC = async (picId: string) => {
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personInChargeId: picId }),
            });
            if (res.ok) {
                fetchCustomer();
                fetchPICHistory();
                showToast("success", "Đã gán nhân viên phụ trách!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Không tìm thấy khách hàng</h2>
                <button
                    onClick={() => router.push("/customers")}
                    className="mt-6 text-brand-500 hover:text-brand-600 font-bold flex items-center space-x-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Trang Khách Hàng</span>
                </button>
            </div>
        );
    }

    const totalBookings = customer.bookings?.length || 0;
    const totalRevenue = customer.bookings?.reduce((acc: number, b: any) => acc + (b.totalRevenue || 0), 0) || 0;

    const TierIcon = {
        VIP: Crown,
        CONVERTED: Star,
        POTENTIAL: Target
    }[customer.tier as 'VIP' | 'CONVERTED' | 'POTENTIAL'] || Target;

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push("/customers")}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-brand-500 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tighter uppercase">{customer.name}</h2>
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                customer.tier === "VIP" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    customer.tier === "CONVERTED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        "bg-slate-50 text-slate-600 border-slate-100"
                            )}>
                                <TierIcon className="w-3.5 h-3.5" />
                                {customer.tier}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                            {(!customer.isApproved && (currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN")) ? (
                                <div className="flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 animate-pulse">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                    <span className="text-rose-600">Khách hàng đang chờ phê duyệt</span>
                                </div>
                            ) : (
                                <span className="flex items-center gap-1"><UserCircle className="w-3.5 h-3.5" /> PIC: {customer.personInCharge?.name || "Unassigned"}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && !customer.isApproved && (
                        <button
                            onClick={handleApprove}
                            className="bg-emerald-500 text-white px-8 py-4 rounded-[20px] text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 border-2 border-white"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Phê duyệt ngay
                        </button>
                    )}
                    <button
                        onClick={handleEdit}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Chỉnh sửa
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-brand-50 flex items-center justify-center shrink-0">
                        <Box className="w-8 h-8 text-brand-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng đơn hàng</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{totalBookings}</h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CreditCard className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Doanh thu tích lũy</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{formatCurr(totalRevenue)}</h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-amber-50 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Xếp hạng</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{customer.tier}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Details Column */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 pb-4 border-b border-slate-50">Hồ sơ khách hàng</h3>
                        
                        {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && (
                            <div className="mb-8 p-6 bg-brand-50 rounded-3xl border border-brand-100">
                                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" />
                                    Gán nhân viên phụ trách
                                </p>
                                <select 
                                    value={customer.personInChargeId || ""}
                                    onChange={(e) => handleAssignPIC(e.target.value)}
                                    className="w-full bg-white border border-brand-200 rounded-2xl px-4 py-3 text-[11px] font-bold text-slate-900 focus:ring-brand-500 uppercase tracking-widest"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-6">
                            {[
                                { icon: Building2, label: "Công ty / Liên hệ", value: customer.name },
                                { icon: Mail, label: "Email", value: customer.email },
                                { icon: Phone, label: "Điện thoại", value: customer.phone || "---" },
                                { icon: MapPin, label: "Lĩnh vực", value: customer.industry || "General Trade" },
                                { icon: UserCircle, label: "Người phụ trách", value: customer.personInCharge?.name || "Chưa gán" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <item.icon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                        <p className="text-xs font-bold text-slate-900 break-all">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transactions Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm min-h-full">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Lịch sử đơn hàng</h3>
                            <button onClick={() => router.push('/bookings')} className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Xem tất cả</button>
                        </div>

                        <div className="space-y-4">
                            {customer.bookings?.length > 0 ? customer.bookings.map((booking: any) => (
                                <Link key={booking.id} href={`/bookings/${booking.id}`} className="group p-6 rounded-3xl bg-slate-50 border border-transparent hover:border-emerald-100 hover:bg-white transition-all block">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1">{booking.reference}</p>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase">{booking.origin} → {booking.destination}</h4>
                                        </div>
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
                                            booking.status === "delivered" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-500 border-orange-100"
                                        )}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Trọng lượng: {booking.chargeableWeight} Kg</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span>Cước: {formatCurr(booking.totalRevenue)}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full ml-auto"></span>
                                        <span>{formatDate(booking.createdAt)}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-center py-20">
                                    <Box className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có dữ liệu đơn hàng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PIC Transfer History */}
            {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <History className="w-4 h-4 text-brand-500" />
                            Lịch sử bàn giao phụ trách
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{picHistory.length} bản ghi</span>
                    </div>

                    {picHistoryLoading ? (
                        <div className="text-center py-10">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : picHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có lịch sử bàn giao</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {picHistory.map((entry: any) => (
                                <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                                        <UserCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800">
                                            <span className="text-slate-400">{entry.fromUser?.name || <span className="italic text-slate-300">Chưa gán</span>}</span>
                                            <ArrowRight className="w-3 h-3 text-brand-500 shrink-0" />
                                            <span className="text-emerald-600">{entry.toUser?.name || <span className="italic text-slate-300">Chưa gán</span>}</span>
                                        </div>
                                        {entry.note && (
                                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{entry.note}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(entry.createdAt)}</p>
                                        {entry.changedBy && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">bởi {entry.changedBy.name}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Chỉnh sửa Khách hàng"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField id="name" label="Tên công ty / Khách hàng" value={formData.name} onChange={handleChange} required />
                        <FormField id="email" label="Email" type="email" value={formData.email} onChange={handleChange} required />
                        <FormField id="phone" label="Số điện thoại" value={formData.phone} onChange={handleChange} />
                        <FormField id="contact" label="Người liên hệ" value={formData.contact} onChange={handleChange} />
                        <FormField id="industry" label="Lĩnh vực / Mã số thuế" value={formData.industry} onChange={handleChange} />
                        <FormField
                            id="tier"
                            label="Phân hạng khách hàng"
                            value={formData.tier}
                            onChange={handleChange}
                            options={[
                                { label: "Tiềm năng (Potential)", value: "POTENTIAL" },
                                { label: "Đã chuyển đổi (Converted)", value: "CONVERTED" },
                                { label: "Khách hàng VIP", value: "VIP" }
                            ]}
                        />
                        {currentUser?.role === "DIRECTOR" && (
                            <div className="md:col-span-2">
                                <FormField
                                    id="personInChargeId"
                                    label="Người phụ trách (Sale/CS)"
                                    value={formData.personInChargeId}
                                    onChange={handleChange}
                                    options={users.map(u => ({ label: `${u.name} (${u.role})`, value: u.id }))}
                                />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <FormField
                                id="status"
                                label="Trạng thái hoạt động"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { label: "Đang hoạt động", value: "active" },
                                    { label: "Ưu tiên", value: "priority" },
                                    { label: "Ngừng hợp tác", value: "inactive" }
                                ]}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100 text-worksans">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 text-[10px] font-bold uppercase text-slate-500">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase shadow-xl disabled:opacity-50">
                            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
