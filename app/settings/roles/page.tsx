"use client";

import {
    ShieldCheck,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    CheckSquare,
    Square,
    Lock,
    Users as UsersIcon,
    AlertCircle
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

const PERMISSIONS = [
    // ── Đơn hàng ─────────────────────────────────────────────────
    { key: "view_bookings",      label: "Xem đơn hàng",                    group: "📦 Đơn hàng" },
    { key: "view_all_bookings",  label: "Xem đơn hàng của tất cả NV",       group: "📦 Đơn hàng" },
    { key: "create_bookings",    label: "Tạo mới đơn hàng",                 group: "📦 Đơn hàng" },
    { key: "edit_bookings",      label: "Sửa đơn hàng",                     group: "📦 Đơn hàng" },
    { key: "delete_bookings",    label: "Xóa đơn hàng",                     group: "📦 Đơn hàng" },
    { key: "approve_bookings",   label: "Duyệt / Từ chối đơn hàng",         group: "📦 Đơn hàng" },
    { key: "assign_bookings",    label: "Phân công đơn hàng cho NV",         group: "📦 Đơn hàng" },
    { key: "export_bookings",    label: "Xuất Excel danh sách đơn hàng",     group: "📦 Đơn hàng" },
    { key: "edit_costs",         label: "Sửa chi phí / giá vốn đơn hàng",   group: "📦 Đơn hàng" },
    { key: "edit_commissions",   label: "Sửa hoa hồng đơn hàng",            group: "📦 Đơn hàng" },
    // ── Khách hàng ───────────────────────────────────────────────
    { key: "view_customers",     label: "Xem danh sách khách hàng",          group: "👤 Khách hàng" },
    { key: "view_all_customers", label: "Xem KH của tất cả nhân viên",       group: "👤 Khách hàng" },
    { key: "create_customers",   label: "Thêm mới khách hàng",               group: "👤 Khách hàng" },
    { key: "edit_customers",     label: "Sửa thông tin khách hàng",          group: "👤 Khách hàng" },
    { key: "delete_customers",   label: "Xóa khách hàng",                    group: "👤 Khách hàng" },
    { key: "approve_customers",  label: "Duyệt / Từ chối khách hàng",        group: "👤 Khách hàng" },
    { key: "export_customers",   label: "Xuất danh sách khách hàng",         group: "👤 Khách hàng" },
    // ── Khách tiềm năng ──────────────────────────────────────────
    { key: "view_leads",         label: "Xem khách tiềm năng (Leads)",       group: "🎯 Khách tiềm năng" },
    { key: "manage_leads",       label: "Cập nhật trạng thái Leads",         group: "🎯 Khách tiềm năng" },
    { key: "delete_leads",       label: "Xóa Leads",                         group: "🎯 Khách tiềm năng" },
    { key: "convert_leads",      label: "Chuyển Lead thành Khách hàng",      group: "🎯 Khách tiềm năng" },
    // ── Hoá đơn ──────────────────────────────────────────────────
    { key: "view_invoices",      label: "Xem hoá đơn",                       group: "🧾 Hoá đơn" },
    { key: "create_invoices",    label: "Tạo hoá đơn",                       group: "🧾 Hoá đơn" },
    { key: "edit_invoices",      label: "Sửa hoá đơn",                       group: "🧾 Hoá đơn" },
    { key: "delete_invoices",    label: "Xóa hoá đơn",                       group: "🧾 Hoá đơn" },
    { key: "send_invoices",      label: "Gửi hoá đơn qua email",             group: "🧾 Hoá đơn" },
    { key: "mark_paid_invoices", label: "Đánh dấu thanh toán hoá đơn",       group: "🧾 Hoá đơn" },
    { key: "download_invoices",  label: "Tải hoá đơn PDF",                   group: "🧾 Hoá đơn" },
    // ── Chuyến bay ───────────────────────────────────────────────
    { key: "view_flights",       label: "Xem chuyến bay",                    group: "✈️ Chuyến bay" },
    { key: "create_flights",     label: "Thêm chuyến bay mới",               group: "✈️ Chuyến bay" },
    { key: "edit_flights",       label: "Sửa thông tin chuyến bay",          group: "✈️ Chuyến bay" },
    { key: "delete_flights",     label: "Xóa chuyến bay",                    group: "✈️ Chuyến bay" },
    // ── Vận hành & Tracking ───────────────────────────────────────
    { key: "manage_tracking",    label: "Cập nhật trạng thái vận chuyển",    group: "🚚 Vận hành" },
    { key: "add_tracking_notes", label: "Thêm ghi chú vận hành",             group: "🚚 Vận hành" },
    { key: "send_notification",  label: "Gửi thông báo email cho khách",     group: "🚚 Vận hành" },
    // ── Báo cáo & Tài chính ───────────────────────────────────────
    { key: "view_analytics",     label: "Xem báo cáo / phân tích",           group: "📊 Báo cáo" },
    { key: "export_analytics",   label: "Xuất báo cáo Excel",                group: "📊 Báo cáo" },
    { key: "view_all_reports",   label: "Xem báo cáo của tất cả nhân viên",  group: "📊 Báo cáo" },
    { key: "view_commissions",   label: "Xem hoa hồng (của mình)",           group: "📊 Báo cáo" },
    { key: "view_all_commissions", label: "Xem hoa hồng tất cả nhân viên",  group: "📊 Báo cáo" },
    { key: "view_costs",         label: "Xem giá vốn / chi phí",             group: "📊 Báo cáo" },
    // ── Nhân sự ───────────────────────────────────────────────────
    { key: "view_users",         label: "Xem danh sách nhân sự",             group: "👥 Nhân sự" },
    { key: "manage_users",       label: "Thêm / Sửa / Xóa nhân viên",        group: "👥 Nhân sự" },
    { key: "manage_roles",       label: "Quản lý phân quyền & vai trò",      group: "👥 Nhân sự" },
    { key: "reset_password",     label: "Đặt lại mật khẩu nhân viên",        group: "👥 Nhân sự" },
    // ── Cài đặt hệ thống ─────────────────────────────────────────
    { key: "view_settings",      label: "Xem cài đặt hệ thống",              group: "⚙️ Hệ thống" },
    { key: "manage_settings",    label: "Sửa cài đặt hệ thống",              group: "⚙️ Hệ thống" },
    { key: "manage_email_templates", label: "Quản lý mẫu email",             group: "⚙️ Hệ thống" },
    { key: "view_activity_log",  label: "Xem nhật ký hệ thống",              group: "⚙️ Hệ thống" },
    { key: "manage_activity_log", label: "Xóa / quản lý nhật ký",           group: "⚙️ Hệ thống" },
];

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        permissions: [] as string[]
    });

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const togglePermission = (key: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter(k => k !== key)
                : [...prev.permissions, key]
        }));
    };

    const handleEdit = (role: any) => {
        setEditingId(role.id);
        setFormData({
            name: role.name,
            description: role.description || "",
            permissions: JSON.parse(role.permissions || "[]")
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingId ? "PATCH" : "POST";
            const body = editingId 
                ? { id: editingId, ...formData, permissions: JSON.stringify(formData.permissions) }
                : { ...formData, permissions: JSON.stringify(formData.permissions) };

            const res = await fetch("/api/roles", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({ name: "", description: "", permissions: [] });
                fetchRoles();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Vai trò & Phân quyền</h2>
                    <p className="text-slate-500 font-bold flex items-center space-x-2 mt-1 uppercase tracking-widest text-[10px]">
                        <Lock className="w-3.5 h-3.5 text-sky-500" />
                        <span>Cấu hình quyền truy cập hệ thống chi tiết</span>
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: "", description: "", permissions: [] });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center space-x-2 bg-brand-500 text-white px-6 py-3 rounded-2xl text-[10px] font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm vai trò mới</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải danh sách vai trò...</div>
                ) : roles.map((role) => (
                    <div key={role.id} className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{role.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        {role._count?.users || 0} Nhân sự
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(role)} className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-6 line-clamp-2 h-8">{role.description || "Không có mô tả cho vai trò này."}</p>

                        <div className="flex flex-wrap gap-2">
                            {JSON.parse(role.permissions || "[]").slice(0, 3).map((p: string) => (
                                <span key={p} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">
                                    {PERMISSIONS.find(per => per.key === p)?.label || p}
                                </span>
                            ))}
                            {JSON.parse(role.permissions || "[]").length > 3 && (
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-widest">
                                    +{JSON.parse(role.permissions || "[]").length - 3} khác
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <FormField 
                            id="name" 
                            label="Tên vai trò" 
                            placeholder="VD: Quản lý chi nhánh, Kế toán trưởng..."
                            value={formData.name} 
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                            required 
                        />
                        <FormField 
                            id="description" 
                            label="Mô tả vai trò" 
                            placeholder="Mô tả ngắn gọn trách nhiệm của vai trò này"
                            value={formData.description} 
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                        />
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Danh sách quyền hạn</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {PERMISSIONS.map((perm) => (
                                <button
                                    key={perm.key}
                                    type="button"
                                    onClick={() => togglePermission(perm.key)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                                        formData.permissions.includes(perm.key)
                                            ? "bg-brand-50 border-brand-200 text-brand-900"
                                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">{perm.label}</p>
                                        <p className="text-[9px] font-medium text-slate-400 group-hover:text-slate-500">{perm.group}</p>
                                    </div>
                                    {formData.permissions.includes(perm.key) ? (
                                        <CheckSquare className="w-5 h-5 text-brand-500" />
                                    ) : (
                                        <Square className="w-5 h-5 text-slate-200" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-bold uppercase text-slate-500">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-10 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-bold uppercase shadow-xl hover:bg-brand-600 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                            {submitting && <ShieldCheck className="w-4 h-4 animate-spin" />}
                            {editingId ? "Cập nhật vai trò" : "Khởi tạo vai trò"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
