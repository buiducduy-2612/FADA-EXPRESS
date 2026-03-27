"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Search, Trash2, CheckCircle, Clock, XCircle, Phone, Mail, MapPin, Package, MessageSquare, Calendar, ExternalLink, RefreshCw, UserCheck } from "lucide-react";

type Lead = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company: string | null;
    origin: string | null;
    destination: string | null;
    cargoType: string | null;
    weight: string | null;
    message: string | null;
    status: string;
    assignedToId: string | null;
    assignedTo: { id: string; name: string; avatar?: string } | null;
    createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    NEW:         { label: "Mới",         color: "bg-orange-50 text-orange-500 border-orange-200",   icon: Clock },
    CONTACTED:   { label: "Đã liên hệ", color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: Phone },
    CONVERTED:   { label: "Đã chuyển",  color: "bg-green-50 text-green-600 border-green-200",  icon: CheckCircle },
    REJECTED:    { label: "Từ chối",    color: "bg-red-50 text-red-600 border-red-200",        icon: XCircle },
};

export default function LeadsPage() {
    const { data: session } = useSession();
    const currentUser = session?.user as any;
    const isAdmin = currentUser?.role !== "SALE";

    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selected, setSelected] = useState<Lead | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [salesUsers, setSalesUsers] = useState<{ id: string; name: string }[]>([]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
            const res = await fetch(`/api/leads${params}`);
            const data = await res.json();
            setLeads(Array.isArray(data) ? data : []);
        } catch {
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) setSalesUsers(await res.json());
        } catch { }
    };

    useEffect(() => { fetchLeads(); }, [statusFilter]);
    useEffect(() => { fetchUsers(); }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            const res = await fetch("/api/leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            const updated = await res.json();
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updated } : null);
        } finally {
            setUpdating(null);
        }
    };

    const assignLead = async (id: string, assignedToId: string | null) => {
        try {
            const res = await fetch("/api/leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, assignedToId }),
            });
            const updated = await res.json();
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updated } : null);
        } catch { }
    };

    const deleteLead = async (id: string) => {
        if (!isAdmin) return;
        if (!confirm("Xác nhận xóa khách hàng tiềm năng này?")) return;
        await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const filtered = leads.filter(l =>
        l.fullName.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search) ||
        (l.company || "").toLowerCase().includes(search.toLowerCase())
    );

    const counts = {
        all: leads.length,
        NEW: leads.filter(l => l.status === "NEW").length,
        CONTACTED: leads.filter(l => l.status === "CONTACTED").length,
        CONVERTED: leads.filter(l => l.status === "CONVERTED").length,
        REJECTED: leads.filter(l => l.status === "REJECTED").length,
    };

    return (
        <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-5 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-orange-500" />
                        Khách hàng tiềm năng
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Danh sách liên hệ từ Landing Page FADA EXPRESS</p>
                </div>
                <div className="flex items-center gap-3">
                    <a href="/landing" target="_blank"
                        className="flex items-center gap-2 text-sm text-orange-500 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors font-medium">
                        <ExternalLink className="w-4 h-4" />
                        Landing Page
                    </a>
                    <button onClick={fetchLeads} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors dark:border-gray-700 dark:text-gray-300">
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                    { key: "all",       label: "Tất cả",       count: counts.all,       color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" },
                    { key: "NEW",       label: "Mới",           count: counts.NEW,       color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600" },
                    { key: "CONTACTED", label: "Đã liên hệ",   count: counts.CONTACTED, color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700" },
                    { key: "CONVERTED", label: "Đã chuyển",    count: counts.CONVERTED, color: "bg-green-50 dark:bg-green-900/20 text-green-700" },
                    { key: "REJECTED",  label: "Từ chối",      count: counts.REJECTED,  color: "bg-red-50 dark:bg-red-900/20 text-red-700" },
                ].map(s => (
                    <button key={s.key} onClick={() => setStatusFilter(s.key)}
                        className={`${s.color} ${statusFilter === s.key ? "ring-2 ring-orange-400 dark:ring-orange-500" : ""} rounded-2xl p-3 text-left transition-all hover:opacity-90 shadow-sm`}>
                        <div className="text-xl md:text-2xl font-bold">{s.count}</div>
                        <div className="text-[10px] md:text-xs font-semibold mt-0.5 uppercase tracking-wide">{s.label}</div>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, email, số điện thoại, công ty..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
                />
            </div>

            {/* Table + Detail Panel */}
            <div className="flex gap-4 min-h-[500px]">
                {/* Table */}
                <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex-1 transition-all ${selected ? "hidden md:block" : ""}`}>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-30" />
                            <p className="font-medium">Chưa có khách hàng tiềm năng</p>
                            <p className="text-sm mt-1">Khách hàng điền form trên landing page sẽ hiển thị tại đây</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Khách hàng</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider hidden sm:table-cell">Liên hệ</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">Tuyến đường</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Phụ trách</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Trạng thái</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">Ngày gửi</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {filtered.map(lead => {
                                        const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                                        return (
                                            <tr key={lead.id}
                                                onClick={() => setSelected(lead)}
                                                className={`hover:bg-orange-50/50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${selected?.id === lead.id ? "bg-orange-50 dark:bg-orange-900/10" : ""}`}>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{lead.fullName}</div>
                                                    {lead.company && <div className="text-gray-400 text-xs">{lead.company}</div>}
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <div className="text-gray-600 dark:text-gray-300">{lead.phone}</div>
                                                    <div className="text-gray-400 text-xs">{lead.email}</div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    {lead.origin && lead.destination ? (
                                                        <span className="text-gray-600 dark:text-gray-300 font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                                            {lead.origin} → {lead.destination}
                                                        </span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {lead.assignedTo ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-[10px] font-bold shrink-0">
                                                                {lead.assignedTo.name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate max-w-[80px]">{lead.assignedTo.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 dark:text-gray-500 italic">Chưa giao</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                                        <cfg.icon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                                                    {new Date(lead.createdAt).toLocaleDateString("vi-VN")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isAdmin && (
                                                        <button onClick={e => { e.stopPropagation(); deleteLead(lead.id); }}
                                                            className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-5 overflow-y-auto max-h-[700px]">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white">Chi tiết liên hệ</h3>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                                {selected.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">{selected.fullName}</div>
                                {selected.company && <div className="text-gray-500 text-sm">{selected.company}</div>}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <InfoRow icon={Phone} value={selected.phone} />
                            <InfoRow icon={Mail} value={selected.email} />
                            {(selected.origin || selected.destination) && (
                                <InfoRow icon={MapPin} value={[selected.origin, selected.destination].filter(Boolean).join(" → ")} />
                            )}
                            {selected.cargoType && <InfoRow icon={Package} value={selected.cargoType} label="Loại hàng" />}
                            {selected.weight && <InfoRow icon={Package} value={selected.weight} label="Trọng lượng" />}
                            {selected.message && <InfoRow icon={MessageSquare} value={selected.message} label="Ghi chú" />}
                            <InfoRow icon={Calendar} value={new Date(selected.createdAt).toLocaleString("vi-VN")} label="Ngày gửi" />
                        </div>

                        {/* Assign to Sales */}
                        {isAdmin && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-orange-500" /> Giao cho nhân viên
                                </p>
                                <select
                                    value={selected.assignedToId || ""}
                                    onChange={e => assignLead(selected.id, e.target.value || null)}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">— Chưa giao —</option>
                                    {salesUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {!isAdmin && selected.assignedTo && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex items-center gap-3">
                                <UserCheck className="w-4 h-4 text-orange-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Phụ trách</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selected.assignedTo.name}</p>
                                </div>
                            </div>
                        )}

                        {/* Status Update */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Cập nhật trạng thái</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <button key={key}
                                        onClick={() => updateStatus(selected.id, key)}
                                        disabled={updating === selected.id}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${selected.status === key ? cfg.color + " ring-2 ring-offset-1 ring-orange-400" : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"}`}>
                                        <cfg.icon className="w-3.5 h-3.5" />
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isAdmin && (
                            <button onClick={() => deleteLead(selected.id)}
                                className="w-full flex items-center justify-center gap-2 text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl text-sm font-medium transition-colors">
                                <Trash2 className="w-4 h-4" />
                                Xóa khách hàng này
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label?: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
                {label && <p className="text-gray-400 text-xs">{label}</p>}
                <p className="text-gray-700 dark:text-gray-200 text-sm">{value}</p>
            </div>
        </div>
    );
}
