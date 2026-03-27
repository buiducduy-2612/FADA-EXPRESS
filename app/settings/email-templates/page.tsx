"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Mail, Code, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import LoadingState from "@/components/ui/LoadingState";

export default function EmailTemplatesPage() {
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/settings/email-templates");
            const data = await res.json();
            setTemplates(data);
            if (data.length > 0) setSelectedTemplate(data[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const method = selectedTemplate.id ? "PATCH" : "POST";
            const res = await fetch("/api/settings/email-templates", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedTemplate)
            });
            if (res.ok) {
                await fetchTemplates();
                showToast("success", "Đã lưu template thành công!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const placeholders = [
        { key: "{{customer_name}}", desc: "Tên khách hàng" },
        { key: "{{reference}}", desc: "Mã đơn hàng" },
        { key: "{{awb}}", desc: "Số vận đơn (AWB)" },
        { key: "{{origin}}", desc: "Điểm đi" },
        { key: "{{destination}}", desc: "Điểm đến" },
        { key: "{{pieces}}", desc: "Số lượng kiện" },
        { key: "{{weight}}", desc: "Trọng lượng tính cước" },
        { key: "{{amount}}", desc: "Tổng tiền" }
    ];

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingState message="Đang tải cấu hình template..." />
        </div>
    );

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-2 italic">EMAIL <span className="text-brand-500">TEMPLATES</span></h1>
                    <p className="text-zinc-500 font-medium uppercase text-[10px] tracking-[0.2em]">Quản lý mẫu email gửi khách hàng</p>
                </div>
                <button 
                    onClick={() => setSelectedTemplate({ name: "NEW_TEMPLATE", subject: "", body: "", type: "CUSTOM" })}
                    className="flex items-center px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl shadow-zinc-900/10"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Template
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* List */}
                <div className="space-y-4">
                    {templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t)}
                            className={cn(
                                "w-full p-6 rounded-3xl border text-left transition-all duration-300",
                                selectedTemplate?.id === t.id 
                                    ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl ring-1 ring-zinc-900/5" 
                                    : "bg-zinc-50 dark:bg-zinc-900/30 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{t.type}</span>
                                <Mail className={cn("w-4 h-4", selectedTemplate?.id === t.id ? "text-brand-500" : "text-zinc-300")} />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight uppercase">{t.name}</h3>
                            <p className="text-xs text-zinc-500 mt-1 truncate">{t.subject}</p>
                        </button>
                    ))}
                </div>

                {/* Editor */}
                {selectedTemplate && (
                    <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500">
                                        <Code className="w-5 h-5" />
                                    </div>
                                    <h2 className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Cấu hình Template</h2>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tên Mẫu</label>
                                        <input 
                                            value={selectedTemplate.name}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loại</label>
                                        <input 
                                            value={selectedTemplate.type}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, type: e.target.value})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tiêu đề Email</label>
                                    <input 
                                        value={selectedTemplate.subject}
                                        onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                                        placeholder="Nhập tiêu đề email..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nội dung HTML</label>
                                        <div className="group relative">
                                            <Info className="w-4 h-4 text-zinc-300 cursor-help" />
                                            <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-zinc-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed font-medium">
                                                <p className="mb-2 font-bold text-brand-500 uppercase">Danh sách Placeholders:</p>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {placeholders.map(p => <div key={p.key}><span className="text-zinc-400">{p.key}</span>: {p.desc}</div>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={selectedTemplate.body}
                                        onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                                        className="w-full h-96 bg-zinc-900 text-zinc-300 font-mono text-xs border-none rounded-3xl p-8 focus:ring-2 focus:ring-brand-500/20 resize-none leading-relaxed"
                                        placeholder="Nhập mã HTML của template..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-3xl p-6 flex items-start space-x-4">
                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                <strong>Lưu ý:</strong> Nội dung email hỗ trợ mã HTML cơ bản. Bạn có thể sử dụng các placeholders bên phải để nhúng dữ liệu đơn hàng tự động. Hãy đảm bảo mã HTML đã được tối ưu cho các trình xem mail (Gmail, Outlook).
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
