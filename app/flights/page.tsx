"use client";

import {
    Plane,
    Search,
    Plus,
    Calendar,
    Globe,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    MoreVertical,
    Navigation,
    Zap
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

export default function FlightsPage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        airline: "",
        flightNo: "",
        origin: "",
        destination: "",
        departure: "",
        arrival: "",
        capacity: 100,
        status: "scheduled",
        type: "Cargo",
        frequency: "Daily"
    });

    const fetchFlights = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/flights");
            if (res.ok) {
                const data = await res.json();
                setFlights(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlights();
    }, []);

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === "capacity" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/flights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({
                    airline: "",
                    flightNo: "",
                    origin: "",
                    destination: "",
                    departure: "",
                    arrival: "",
                    capacity: 100,
                    status: "scheduled",
                    type: "Cargo",
                    frequency: "Daily"
                });
                fetchFlights();
                showToast("success", "Flight added successfully!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFlights = flights.filter(f =>
        f.flightNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.destination?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 md:space-x-6">
                    <div className="h-14 w-14 md:h-20 md:w-20 bg-slate-900 rounded-2xl md:rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-900/10 border-2 md:border-4 border-white shrink-0 relative overflow-hidden group">
                        <Plane className="w-6 h-6 md:w-10 md:h-10 text-white group-hover:scale-125 transition-all duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tighter">{t("flights.title")}</h2>
                        <p className="text-slate-500 font-bold flex flex-wrap items-center gap-2 mt-1 uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Navigation className="w-3.5 h-3.5 mr-1 text-brand-500" /> Monitoring {flights.length} active routes
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none h-12 px-8 rounded-2xl bg-slate-900 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <Plus className="w-5 h-5 shadow-inner" />
                        <span>Add Flight</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="relative group w-full lg:w-1/3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-all font-bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("common.search") + "..."}
                        className="h-12 w-full rounded-2xl bg-slate-50 pl-11 pr-4 text-xs font-bold text-slate-900 border border-transparent focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-500/5 focus:outline-none transition-all duration-300 uppercase tracking-widest shadow-inner"
                    />
                </div>
            </div>

            {/* Flight Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Flights Hub...</div>
                ) : filteredFlights.length === 0 ? (
                    <div className="col-span-full py-20 text-center font-bold text-slate-400">No flights found. Add one to get started!</div>
                ) : filteredFlights.map((flight) => (
                    <div key={flight.id} className="group bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-sky-100 transition-all duration-700 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                            <Plane className="w-32 h-32" />
                        </div>
                        <div className="flex items-center justify-between mb-8 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:rotate-6 transition-all shadow-inner group-hover:bg-white overflow-hidden">
                                    <Plane className="w-6 h-6 text-slate-400 group-hover:text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tighter group-hover:text-brand-800 transition-colors uppercase">{flight.airline}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{flight.type} • {flight.frequency}</p>
                                </div>
                            </div>
                            <span className={cn(
                                "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border shadow-sm",
                                flight.status === "on_time" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    flight.status === "delayed" ? "bg-red-50 text-red-700 border-red-100" :
                                        "bg-slate-50 text-slate-700 border-slate-100 font-bold"
                            )}>
                                {t(`status.${flight.status}`).toUpperCase()}
                            </span>
                        </div>

                        <div className="bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all rounded-[32px] p-8 mb-8 z-10 flex items-center justify-between shadow-inner">
                            <div className="text-center group-hover:scale-110 transition-transform">
                                <p className="text-3xl font-bold text-slate-900 tracking-tighter uppercase">{flight.origin}</p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">{t("flights.departure")}</p>
                                <p className="text-lg font-bold text-slate-900 mt-2">{flight.departure}</p>
                            </div>
                            <div className="flex flex-col items-center flex-1 mx-8 relative">
                                <div className="w-full h-[1px] bg-slate-200 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 ring-1 ring-slate-100 rounded-full shadow-sm">
                                        <Plane className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest">{flight.flightNo}</span>
                            </div>
                            <div className="text-center group-hover:scale-110 transition-transform">
                                <p className="text-3xl font-bold text-slate-900 tracking-tighter uppercase">{flight.destination}</p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">{t("flights.arrival")}</p>
                                <p className="text-lg font-bold text-slate-900 mt-2">{flight.arrival}</p>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between z-10 pt-4">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("flights.cargo_capacity")}</p>
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl font-bold text-slate-900">{flight.capacity}%</span>
                                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                        <div className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            flight.capacity > 80 ? "bg-amber-500" : "bg-brand-500"
                                        )} style={{ width: `${flight.capacity}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[18px] transition-all hover:bg-slate-100">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Flight Schedule"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField id="airline" label="Airline" value={formData.airline} onChange={handleChange} required />
                        <FormField id="flightNo" label="Flight Number" value={formData.flightNo} onChange={handleChange} required />
                        <FormField id="origin" label="Origin (e.g. SGN)" value={formData.origin} onChange={handleChange} required />
                        <FormField id="destination" label="Destination (e.g. HKG)" value={formData.destination} onChange={handleChange} required />
                        <FormField id="departure" label="Departure Time" value={formData.departure} onChange={handleChange} required placeholder="HH:mm" />
                        <FormField id="arrival" label="Arrival Time" value={formData.arrival} onChange={handleChange} required placeholder="HH:mm" />
                        <FormField id="capacity" label="Capacity (%)" type="number" value={formData.capacity} onChange={handleChange} required />
                        <FormField id="frequency" label="Frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. Daily or Mon,Wed,Fri" />
                        <FormField id="status" label="Status" value={formData.status} onChange={handleChange} required options={[
                            { label: "Scheduled", value: "scheduled" },
                            { label: "On Time", value: "on_time" },
                            { label: "Delayed", value: "delayed" }
                        ]} />
                        <FormField id="type" label="Type" value={formData.type} onChange={handleChange} required options={[
                            { label: "Cargo", value: "Cargo" },
                            { label: "Passenger", value: "Passenger" }
                        ]} />
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">{t("common.cancel")}</button>
                        <button type="submit" disabled={submitting} className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:opacity-50">{submitting ? "..." : t("common.save")}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
