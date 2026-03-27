"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Users,
    Search,
    Filter,
    Download,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Building2,
    TrendingUp,
    Box,
    CreditCard,
    ChevronRight,
    Trash2,
    Edit2,
    Star,
    Crown,
    Target,
    ShieldCheck,
    AlertTriangle,
    UserCircle
} from "lucide-react";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

export default function CustomersPage() {
    return (
        <Suspense fallback={<div className="p-8 font-semibold text-slate-400 animate-pulse">Đang tải dữ liệu khách hàng...</div>}>
            <CustomersContent />
        </Suspense>
    );
}

function CustomersContent() {
    const { t, formatCurr } = useLanguage();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status") || "approved";
    const currentUser = session?.user as any;

    const [customers, setCustomers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterTier, setFilterTier] = useState("all");
    const [filterPIC, setFilterPIC] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        contact: "",
        industry: "",
        taxCode: "",
        status: "active",
        tier: "POTENTIAL",
        personInChargeId: "",
        isApproved: false,
        address: ""
    });

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/customers?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

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

    useEffect(() => {
        fetchCustomers();
        fetchUsers();
    }, [fetchCustomers, currentUser?.role]);

    const handleQuickApprove = async (id: string) => {
        if (!confirm("Xác nhận phê duyệt khách hàng này?")) return;
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: true }),
            });
            if (res.ok) {
                fetchCustomers();
                showToast("success", "Đã duyệt khách hàng thành công!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignPIC = async (customerId: string, picId: string) => {
        try {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personInChargeId: picId }),
            });
            if (res.ok) {
                fetchCustomers();
                showToast("success", "Đã gán nhân viên phụ trách!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xác nhận xóa khách hàng?")) return;
        try {
            const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchCustomers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (cust: any) => {
        setEditingId(cust.id);
        setFormData({
            name: cust.name || "",
            email: cust.email || "",
            phone: cust.phone || "",
            contact: cust.contact || "",
            industry: cust.industry || "",
            taxCode: cust.taxCode || "",
            status: cust.status || "active",
            tier: cust.tier || "POTENTIAL",
            personInChargeId: cust.personInChargeId || "",
            isApproved: cust.isApproved || false,
            address: cust.address || ""
        });
        setIsModalOpen(true);
    };

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
            const method = editingId ? "PATCH" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    contact: "",
                    industry: "",
                    taxCode: "",
                    status: "active",
                    tier: "POTENTIAL",
                    personInChargeId: "",
                    isApproved: false,
                    address: ""
                });
                setEditingId(null);
                fetchCustomers();
                showToast("success", "Thao tác thành công!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = (
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesOverallStatus = filterStatus === "all" || c.status === filterStatus;
        const matchesTier = filterTier === "all" || c.tier === filterTier;
        const matchesPIC = filterPIC === "all" || c.personInChargeId === filterPIC;
        return matchesSearch && matchesOverallStatus && matchesTier && matchesPIC;
    });

    const getTierBadge = (tier: string) => {
        const icons = { VIP: Crown, CONVERTED: Star, POTENTIAL: Target };
        const colors = { 
            VIP: "bg-amber-50 text-amber-600 border-amber-100", 
            CONVERTED: "bg-emerald-50 text-emerald-600 border-emerald-100", 
            POTENTIAL: "bg-slate-50 text-slate-600 border-slate-100" 
        };
        const Icon = icons[tier as keyof typeof icons] || Target;
        const colorClass = colors[tier as keyof typeof colors] || colors.POTENTIAL;
        
        return (
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", colorClass)}>
                <Icon className="w-3.5 h-3.5" />
                {tier}
            </span>
        );
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {statusFilter === "pending" ? "Duyệt Khách hàng mới" : "Danh sách Khách hàng"}
                    </h2>
                    <p className="text-slate-500 font-medium flex items-center space-x-2 mt-1 text-sm">
                        <span>{statusFilter === "pending" ? "Đang chờ phê duyệt" : "Cơ sở dữ liệu tập trung"}</span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-2"></span>
                        <span className="text-emerald-500">{customers.length} đối tác</span>
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm khách hàng
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-all" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                        className="h-11 w-full rounded-2xl bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 border border-transparent focus:bg-white focus:border-brand-300 focus:outline-none transition-all"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="priority">Ưu tiên</option>
                        <option value="inactive">Ngừng hợp tác</option>
                    </select>
                    <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                    >
                        <option value="all">Tất cả phân hạng</option>
                        <option value="POTENTIAL">Tiềm năng</option>
                        <option value="CONVERTED">Đã chuyển đổi</option>
                        <option value="VIP">Khách hàng VIP</option>
                    </select>
                    {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && (
                        <select
                            value={filterPIC}
                            onChange={(e) => setFilterPIC(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                        >
                            <option value="all">Tất cả nhân viên</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-semibold text-slate-400 animate-pulse">Đang tải dữ liệu...</div>
                ) : filteredCustomers.map((cust) => (
                    <div key={cust.id} className="group bg-white rounded-[32px] md:rounded-[40px] border border-slate-200 p-5 md:p-8 shadow-sm hover:shadow-2xl hover:border-brand-100 transition-all duration-500 overflow-hidden relative">
                        <div className="flex items-start justify-between mb-5 md:mb-8">
                            <div className="flex items-center space-x-3 md:space-x-5 min-w-0 flex-1">
                                <div className="h-12 w-12 md:h-16 md:w-16 flex-shrink-0 rounded-2xl bg-white flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:border-brand-100 transition-all duration-500">
                                    <Building2 className="w-6 h-6 md:w-8 md:h-8 text-brand-500" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base md:text-xl font-bold text-slate-900 tracking-tight group-hover:text-brand-600 transition-colors">{cust.name}</h3>
                                        {!cust.isApproved && (
                                            <span className="flex items-center gap-1 text-[8px] font-bold text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-50 rounded-md border border-rose-100">
                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                Chờ duyệt
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {getTierBadge(cust.tier || "POTENTIAL")}
                                        {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-semibold text-slate-400">Phụ trách:</span>
                                                <select 
                                                    defaultValue={cust.personInChargeId || ""}
                                                    onChange={(e) => handleAssignPIC(cust.id, e.target.value)}
                                                    className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:ring-brand-500 cursor-pointer"
                                                >
                                                    <option value="">Chưa gán</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><UserCircle className="w-3 h-3" /> {cust.personInCharge?.name || "Chưa gán"}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {(session?.user as any)?.role !== "SALE" && (
                                    <button onClick={() => handleDelete(cust.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                )}
                                <button onClick={() => handleEdit(cust)} className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-8 mb-5 md:mb-8">
                            <div className="space-y-3 md:space-y-4">
                                <div className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                                    <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 flex-shrink-0" />
                                    <span className="text-[10px] md:text-[11px] font-bold truncate tracking-tight">{cust.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                                    <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 flex-shrink-0" />
                                    <span className="text-[10px] md:text-[11px] font-bold tracking-tight">{cust.phone || "No Phone"}</span>
                                </div>
                            </div>
                            <div className="space-y-3 md:space-y-4 border-l border-slate-100 pl-4 md:pl-8">
                                <div className="flex items-center gap-2">
                                    <Box className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-500 flex-shrink-0" />
                                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400"><span className="text-slate-900">{cust.bookings?.length || 0}</span> đơn</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-[10px] md:text-[11px] font-bold text-slate-400 tracking-tight truncate">{formatCurr(cust.bookings?.reduce((acc: number, b: any) => acc + (b.totalRevenue || 0), 0) || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between pt-5 border-t border-slate-50 gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium text-slate-400 mb-0.5">Tham gia ngày</span>
                                <span className="text-[10px] font-bold text-slate-900 tracking-tight">{formatDate(cust.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/customers/${cust.id}`} className="group/btn flex items-center gap-1.5 bg-slate-900 hover:bg-zinc-800 text-white px-4 py-2.5 md:px-5 md:py-2.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                                    <span className="text-xs font-semibold">Xem hồ sơ</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                                {!cust.isApproved && (currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && (
                                    <button 
                                        onClick={() => handleQuickApprove(cust.id)}
                                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 md:px-5 md:py-2.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">Duyệt ngay</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredCustomers.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">Không tìm thấy khách hàng phù hợp</div>
                )}
            </div>

            {/* Modal for New/Edit Customer */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        contact: "",
                        industry: "",
                        taxCode: "",
                        status: "active",
                        tier: "POTENTIAL",
                        personInChargeId: "",
                        isApproved: false,
                        address: ""
                    });
                }}
                title={editingId ? "Chỉnh sửa khách hàng" : "Thêm mới Đối tác"}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField id="name" label="Tên công ty / Liên hệ" value={formData.name} onChange={handleChange} required />
                        <FormField id="email" label="Email liên hệ" type="email" value={formData.email} onChange={handleChange} required />
                        <FormField id="phone" label="Số điện thoại" value={formData.phone} onChange={handleChange} />
                        <FormField id="contact" label="Đại diện khách hàng" value={formData.contact} onChange={handleChange} />
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
                        {(currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN") && (
                            <>
                                <FormField 
                                    id="personInChargeId" 
                                    label="Nhân viên phụ trách" 
                                    value={formData.personInChargeId} 
                                    onChange={handleChange} 
                                    options={[
                                        { label: "-- Chọn nhân viên --", value: "" },
                                        ...users.map(u => ({ label: u.name, value: u.id }))
                                    ]} 
                                />
                                <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <input 
                                        type="checkbox" 
                                        id="isApproved" 
                                        checked={formData.isApproved} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, isApproved: e.target.checked }))}
                                        className="w-5 h-5 rounded-md border-amber-200 text-amber-600 focus:ring-amber-500"
                                    />
                                    <label htmlFor="isApproved" className="text-xs font-bold text-amber-800 uppercase tracking-widest cursor-pointer">Phê duyệt khách hàng này</label>
                                </div>
                            </>
                        )}
                        <div className="md:col-span-2">
                            <FormField id="address" label="Địa chỉ đầy đủ" value={formData.address} onChange={handleChange} placeholder="Số nhà, tên đường, phường, quận, thành phố..." />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                id="status"
                                label="Trạng thái hợp tác"
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
                    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-bold uppercase text-slate-500">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-10 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-bold uppercase shadow-xl hover:bg-brand-600 transition-all disabled:opacity-50">
                            {submitting ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
