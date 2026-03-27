"use client";

import {
    Users,
    Search,
    Plus,
    Mail,
    Shield,
    Trash2,
    CheckCircle2,
    Calendar,
    ChevronRight,
    UserCircle,
    Key,
    Edit2,
    Camera
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

export default function UsersPage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "SALE",
        commissionRate: 0,
        avatar: ""
    });

    const openEditModal = (user: any) => {
        setFormData({
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "SALE",
            commissionRate: user.commissionRate || 0,
            avatar: user.avatar || ""
        });
        setEditId(user.id);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({ name: "", email: "", password: "", role: "SALE", commissionRate: 0, avatar: "" });
        setEditId(null);
        setIsModalOpen(true);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete user ${name}?`)) return;
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchUsers();
            } else {
                showToast("error", "Failed to delete user");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const isEdit = !!editId;
            const url = "/api/users";
            const method = isEdit ? "PATCH" : "POST";
            const payload = isEdit ? { ...formData, id: editId } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ name: "", email: "", password: "", role: "SALE", commissionRate: 0, avatar: "" });
                setEditId(null);
                fetchUsers();
                showToast("success", `User ${isEdit ? 'updated' : 'created'} successfully!`);
            } else {
                const data = await res.json();
                showToast("error", data.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
            }
        } catch (err) {
            console.error(err);
            showToast("error", "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nhân sự hệ thống</h2>
                    <p className="text-slate-500 font-bold flex items-center space-x-2 mt-1 uppercase tracking-widest text-[10px]">
                        <span>Quản lý tài khoản Admin & Sales</span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-2"></span>
                        <span className="text-brand-500">{users.length} Nhân sự hoạt động</span>
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 bg-slate-900 dark:bg-brand-500 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 dark:hover:bg-brand-600 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="uppercase tracking-widest">Thêm nhân viên</span>
                </button>
            </div>

            {/* User List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải danh sách nhân sự...</div>
                ) : users.map((user) => (
                    <div key={user.id} className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm",
                                user.role === "ADMIN"
                                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20"
                                    : "bg-brand-50 dark:bg-brand-500/10 text-brand-500 border-brand-100 dark:border-brand-500/20"
                            )}>
                                {user.role}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter uppercase mb-1">{user.name || "N/A"}</h3>
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-6">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold truncate">{user.email}</span>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ngày tham gia</span>
                                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-300">{formatDate(user.createdAt)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Hoa hồng (%)</span>
                                <span className="text-sm font-bold text-brand-500">{user.commissionRate || 0}%</span>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openEditModal(user)}
                                    className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id, user.name)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for New User */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Sửa thông tin nhân viên" : "Tạo nhân viên mới"}
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group/modal-avatar">
                        <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden relative">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle className="w-10 h-10 text-slate-300" />
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/modal-avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Upload</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                            {formData.avatar && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, avatar: "" }))}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all z-10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">Avatar nhân viên</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        id="name"
                        label="Họ và Tên"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                    />
                    <FormField
                        id="email"
                        label="Địa chỉ Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@logictis.com"
                    />
                    <FormField
                        id="password"
                        label={editId ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"}
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!editId}
                        placeholder="••••••••"
                    />
                    <FormField
                        id="role"
                        label="Vai trò"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        options={[
                            { label: "Nhân viên Sales", value: "SALE" },
                            { label: "Quản trị hệ thống", value: "ADMIN" }
                        ]}
                    />
                    <FormField
                        id="commissionRate"
                        label="Mức hoa hồng (%)"
                        type="number"
                        value={formData.commissionRate}
                        onChange={handleChange}
                        required
                        placeholder="0"
                    />
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-worksans"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 rounded-2xl bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-500/10 hover:bg-brand-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 font-worksans"
                        >
                            {submitting ? "Processing..." : (editId ? "Cập nhật" : "Tạo tài khoản")}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
