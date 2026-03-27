"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Activity, ShieldCheck, Database, Building2, User, FileText, Anchor } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ActivityLogPage() {
    const { t } = useLanguage();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch("/api/activity");
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const getIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case "CUSTOMER": return <Building2 className="w-4 h-4 text-brand-500" />;
            case "SHIPMENT": return <Anchor className="w-4 h-4 text-orange-500" />;
            case "QUOTE": return <FileText className="w-4 h-4 text-amber-500" />;
            case "INVOICE": return <FileText className="w-4 h-4 text-emerald-500" />;
            case "USER": return <User className="w-4 h-4 text-purple-500" />;
            default: return <Database className="w-4 h-4 text-slate-500" />;
        }
    };

    const getActionBadge = (action: string) => {
        switch (action.toUpperCase()) {
            case "CREATE": return <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] uppercase font-bold tracking-widest">Create</span>;
            case "UPDATE": return <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[9px] uppercase font-bold tracking-widest">Update</span>;
            case "DELETE": return <span className="px-2 py-1 rounded bg-red-50 text-red-600 border border-red-100 text-[9px] uppercase font-bold tracking-widest">Delete</span>;
            default: return <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100 text-[9px] uppercase font-bold tracking-widest">{action}</span>;
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs</h2>
                    <p className="text-slate-500 font-bold flex items-center space-x-2 mt-1 uppercase tracking-widest text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-brand-500" />
                        Admin Activity Trail
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl md:rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto p-4 md:p-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">User</th>
                                <th className="px-8 py-5">Action</th>
                                <th className="px-8 py-5">Entity</th>
                                <th className="px-8 py-5">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-bold">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Loading Logs...</td></tr>
                            ) : activities.map((log) => (
                                <tr key={log.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-6 text-xs text-slate-500">
                                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{log.user?.name || "Unknown"}</span>
                                            <span className="text-[10px] text-slate-400 tracking-widest uppercase">{log.user?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col items-start px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="flex items-center space-x-2">
                                                {getIcon(log.entityType)}
                                                <span className="text-xs font-bold text-slate-900 uppercase">{log.entityType}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 mt-1">{log.entityId}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-xs truncate text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            {log.details ? log.details : "N/A"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
