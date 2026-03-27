"use client";

import {
    FileCheck,
    Search,
    Plus,
    Printer,
    MoreVertical,
    Link as LinkIcon,
    ShieldCheck,
    MoveRight,
    Globe,
    Box,
    Truck
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

export default function AWBPage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [bookingsWithAwb, setBookingsWithAwb] = useState<any[]>([]);
    const [bookingsWithoutAwb, setBookingsWithoutAwb] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id: "",
        awbNumber: ""
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bookings");
            if (res.ok) {
                const data = await res.json();
                setBookingsWithAwb(data.filter((b: any) => b.awbNumber));
                setBookingsWithoutAwb(data.filter((b: any) => !b.awbNumber));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id || !formData.awbNumber) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${formData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbNumber: formData.awbNumber }),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ id: "", awbNumber: "" });
                fetchData();
                showToast("success", "Đã cập nhật mã AWB thành công!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAwb = bookingsWithAwb.filter(item =>
        item.awbNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight uppercase">Sổ cái Vận đơn (AWB)</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                        Xác thực & Đối soát Mã vận đơn Quốc tế
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 px-8 rounded-2xl bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center space-x-3 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Cấp mã AWB</span>
                </button>
            </div>

            {/* Stats Header Summary */}
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                 <div className="relative group w-full lg:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-500 transition-all" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm mã AWB, mã đơn hàng..."
                        className="h-12 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 pl-11 pr-4 text-[10px] font-bold text-zinc-900 dark:text-white border border-transparent focus:bg-white focus:border-brand-300 focus:outline-none transition-all uppercase tracking-widest"
                    />
                </div>
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Đã cấp mã</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{bookingsWithAwb.length}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700"></div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Chưa cấp mã</span>
                        <span className="text-sm font-bold text-brand-500">{bookingsWithoutAwb.length}</span>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-zinc-50 dark:border-zinc-800">
                                <th className="px-8 py-6">Mã AWB & Ngày cấp</th>
                                <th className="px-8 py-6">Đối tác (Shipper/Bên nhận)</th>
                                <th className="px-8 py-6 text-center">Chặng bay</th>
                                <th className="px-8 py-6 text-center">Đơn hàng gốc</th>
                                <th className="px-8 py-6 text-center">Trạng thái</th>
                                <th className="px-8 py-6 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Syncing Master Ledger Data...</td></tr>
                            ) : filteredAwb.map((b) => (
                                <tr key={b.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 group-hover:bg-brand-500 group-hover:border-brand-500 transition-all">
                                                <FileCheck className="w-6 h-6 text-zinc-300 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight uppercase group-hover:text-brand-600 transition-colors">{b.awbNumber}</span>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{formatDate(b.createdAt)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{b.customer?.name}</span>
                                            <span className="text-[9px] text-zinc-400 uppercase tracking-widest">{b.shipper || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center space-x-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-4 py-2 rounded-2xl">
                                            <span className="text-xs font-bold text-zinc-900 dark:text-white">{b.origin}</span>
                                            <MoveRight className="w-3.5 h-3.5 text-zinc-300" />
                                            <span className="text-xs font-bold text-zinc-900 dark:text-white">{b.destination}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                            <LinkIcon className="w-3 h-3" />
                                            <span>{b.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm",
                                            b.status === "delivered" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                b.status === "cargo_received" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-sky-50 text-sky-600 border-sky-100"
                                        )}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-200"><MoreVertical className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredAwb.length === 0 && !loading && (
                        <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest">Không có bản ghi nào phù hợp kết quả tìm kiếm</div>
                    )}
                </div>
            </div>

            {/* Modal for Issuing AWB */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Cấp mã Vận đơn (AWB)"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-brand-50 rounded-2xl border border-brand-100 relative overflow-hidden group">
                            <Truck className="w-10 h-10 text-brand-500 opacity-20 absolute -right-2 top-0 group-hover:translate-x-4 transition-transform duration-500" />
                            <FormField
                                id="id"
                                label="Tham chiếu Đơn hàng chưa có AWB"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                options={[
                                    { label: "-- Chọn đơn hàng --", value: "" },
                                    ...bookingsWithoutAwb.map(b => ({ label: `${b.reference} (${b.customer?.name} - ${b.origin}→${b.destination})`, value: b.id }))
                                ]}
                            />
                        </div>
                        <FormField
                            id="awbNumber"
                            label="Mã vận đơn AWB chính thức"
                            value={formData.awbNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g. 160-29381204"
                        />
                    </div>
                    <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.id}
                            className="px-10 py-3 rounded-2xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:bg-brand-600 transition-all disabled:opacity-50"
                        >
                            {submitting ? "Đang xử lý..." : "Xác nhận cấp mã"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
