"use client";

import { useState } from "react";
import { Search, ExternalLink, Package, ChevronRight, Plane, CheckCircle2, Clock, MapPin, RefreshCw, AlertTriangle, KeyRound } from "lucide-react";
import Link from "next/link";

type Carrier = {
    id: string;
    name: string;
    logo: string;
    color: string;
    bgColor: string;
    trackUrl: (n: string) => string;
    prefixes?: string[];
    pattern?: RegExp;
    category: "express" | "airline";
    description: string;
};

const CARRIERS: Carrier[] = [
    {
        id: "dhl",
        name: "DHL Express",
        logo: "https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg",
        color: "#FFCC00",
        bgColor: "#FFCC0015",
        trackUrl: (n) => `https://www.dhl.com/vn-en/home/tracking.html?tracking-id=${n}&submit=1`,
        pattern: /^\d{10,11}$/,
        category: "express",
        description: "Chuyển phát nhanh toàn cầu",
    },
    {
        id: "fedex",
        name: "FedEx",
        logo: "https://www.fedex.com/content/dam/fedex-com/logos/logo.png",
        color: "#4D148C",
        bgColor: "#4D148C15",
        trackUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
        pattern: /^\d{12}$|^\d{15}$|^96\d{18}$|^7489\d{16}$/,
        category: "express",
        description: "Express & freight quốc tế",
    },
    {
        id: "ups",
        name: "UPS",
        logo: "https://www.ups.com/assets/resources/images/UPS_logo.svg",
        color: "#351C15",
        bgColor: "#351C1515",
        trackUrl: (n) => `https://www.ups.com/track?tracknum=${n}&loc=vi_VN`,
        prefixes: ["1Z"],
        category: "express",
        description: "Vận chuyển bưu kiện & hàng hóa",
    },
    {
        id: "tnt",
        name: "TNT / FedEx Freight",
        logo: "https://www.tnt.com/content/dam/tnt/global/all_images/logo/TNT_logo_RGB.svg",
        color: "#FF6200",
        bgColor: "#FF620015",
        trackUrl: (n) => `https://www.tnt.com/express/vn_vn/site/shipping-tools/tracking.html?searchType=con&cons=${n}`,
        category: "express",
        description: "Giao nhận hàng hóa & bưu kiện",
    },
    {
        id: "yunexpress",
        name: "Yun Express",
        logo: "https://www.yunexpress.com/Content/images/logo.png",
        color: "#1677FF",
        bgColor: "#1677FF15",
        trackUrl: (n) => `https://www.yunexpress.com/query?q=${n}`,
        prefixes: ["YT"],
        category: "express",
        description: "Vận chuyển Trung Quốc - Quốc tế",
    },
    {
        id: "4px",
        name: "4PX Express",
        logo: "https://www.4px.com/static/images/logo.png",
        color: "#E2231A",
        bgColor: "#E2231A15",
        trackUrl: (n) => `https://track.4px.com/#/result/${n}`,
        prefixes: ["SFC", "UBI"],
        category: "express",
        description: "Cross-border logistics TQ",
    },
    {
        id: "vietnam-airlines",
        name: "Vietnam Airlines Cargo",
        logo: "https://www.vietnamairlines.com/~/media/Vietnam%20Airlines/Logo/Logo-2018.ashx",
        color: "#003087",
        bgColor: "#00308715",
        trackUrl: (n) => `https://cargo.vietnamairlines.com/en/track-trace?awb=${n}`,
        prefixes: ["738"],
        category: "airline",
        description: "AWB prefix: 738-XXXXXXXX",
    },
    {
        id: "cathay",
        name: "Cathay Pacific Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Cathay_Pacific_2015.svg/200px-Cathay_Pacific_2015.svg.png",
        color: "#006564",
        bgColor: "#00656415",
        trackUrl: (n) => `https://www.cathaypacificcargo.com/en-us/tools/cargo-tracking.html?prefix=160&suffix=${n.replace(/^160/, "")}`,
        prefixes: ["160"],
        category: "airline",
        description: "AWB prefix: 160-XXXXXXXX",
    },
    {
        id: "korean-air",
        name: "Korean Air Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Korean_Air_logo.svg/200px-Korean_Air_logo.svg.png",
        color: "#00256C",
        bgColor: "#00256C15",
        trackUrl: (n) => `https://www.koreanair.com/us/en/cargo/flight-information/cargo-tracking?awbPrefix=180&awbSuffix=${n.replace(/^180-?/, "")}`,
        prefixes: ["180"],
        category: "airline",
        description: "AWB prefix: 180-XXXXXXXX",
    },
    {
        id: "qatar",
        name: "Qatar Airways Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Qatar_Airways_Logo.svg/200px-Qatar_Airways_Logo.svg.png",
        color: "#5C0632",
        bgColor: "#5C063215",
        trackUrl: (n) => `https://qrcargo.com/s/track-your-shipment?trackingId=${n}`,
        prefixes: ["157"],
        category: "airline",
        description: "AWB prefix: 157-XXXXXXXX",
    },
    {
        id: "emirates",
        name: "Emirates SkyCargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/200px-Emirates_logo.svg.png",
        color: "#C01B24",
        bgColor: "#C01B2415",
        trackUrl: (n) => `https://skycargo.com/en/track-your-shipment?awb=${n}`,
        prefixes: ["176"],
        category: "airline",
        description: "AWB prefix: 176-XXXXXXXX",
    },
    {
        id: "singapore",
        name: "Singapore Airlines Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Singapore_Airlines_logo_2.svg/200px-Singapore_Airlines_logo_2.svg.png",
        color: "#002366",
        bgColor: "#00236615",
        trackUrl: (n) => `https://www.siacargo.com/tracking/?type=single&awbNo=${n}`,
        prefixes: ["618"],
        category: "airline",
        description: "AWB prefix: 618-XXXXXXXX",
    },
    {
        id: "lufthansa",
        name: "Lufthansa Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lufthansa_Logo_2018.svg/200px-Lufthansa_Logo_2018.svg.png",
        color: "#05164D",
        bgColor: "#05164D15",
        trackUrl: (n) => `https://lufthansa-cargo.com/en/operations/track-trace/shipment-tracking?awbNo=${n}`,
        prefixes: ["020"],
        category: "airline",
        description: "AWB prefix: 020-XXXXXXXX",
    },
    {
        id: "turkish",
        name: "Turkish Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Turkish_Airlines_logo_2019_compact.svg/200px-Turkish_Airlines_logo_2019_compact.svg.png",
        color: "#C60000",
        bgColor: "#C6000015",
        trackUrl: (n) => `https://www.turkishcargo.com.tr/en/track-your-shipment?awb=${n}`,
        prefixes: ["235"],
        category: "airline",
        description: "AWB prefix: 235-XXXXXXXX",
    },
    {
        id: "etihad",
        name: "Etihad Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Etihad_Airways_Logo.svg/200px-Etihad_Airways_Logo.svg.png",
        color: "#BD8B13",
        bgColor: "#BD8B1315",
        trackUrl: (n) => `https://etihadcargo.com/en/tools/cargo-tracking?awb=${n}`,
        prefixes: ["607"],
        category: "airline",
        description: "AWB prefix: 607-XXXXXXXX",
    },
    {
        id: "japan-airlines",
        name: "Japan Airlines Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/JAL_logo_%28kamon%29.svg/120px-JAL_logo_%28kamon%29.svg.png",
        color: "#C8102E",
        bgColor: "#C8102E15",
        trackUrl: (n) => `https://www.jal.co.jp/jalcargo/inter/track/awb?awb=${n}`,
        prefixes: ["131"],
        category: "airline",
        description: "AWB prefix: 131-XXXXXXXX",
    },
    {
        id: "china-airlines",
        name: "China Airlines Cargo",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/China_Airlines_logo.svg/200px-China_Airlines_logo.svg.png",
        color: "#CC0000",
        bgColor: "#CC000015",
        trackUrl: (n) => `https://www.cargo.china-airlines.com/en/Cargo/track/awbQuery?awb=${n}`,
        prefixes: ["297"],
        category: "airline",
        description: "AWB prefix: 297-XXXXXXXX",
    },
];

type TrackingResult = {
    found: boolean;
    booking?: {
        reference: string;
        awbNumber?: string;
        origin: string;
        destination: string;
        status: string;
        statusLabel: string;
        statusIcon: string;
        statusColor: string;
        approvalStatus: string;
        service?: string;
        pieces: number;
        weight: number;
        shipDate?: string;
        etd?: string;
        eta?: string;
        senderName?: string;
        senderCity?: string;
        senderCountry?: string;
        recipientName?: string;
        recipientCity?: string;
        recipientCountry?: string;
    };
    timeline?: {
        id: string;
        timestamp: string;
        status: string;
        title: string;
        description: string;
        location: string;
    }[];
};

const STATUS_COLOR: Record<string, string> = {
    green: "text-emerald-600 bg-emerald-50 border-emerald-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    yellow: "text-yellow-700 bg-yellow-50 border-yellow-200",
    red: "text-red-600 bg-red-50 border-red-200",
    gray: "text-gray-600 bg-gray-50 border-gray-200",
};

const TIMELINE_ICON_COLOR: Record<string, string> = {
    green: "bg-emerald-500 border-emerald-300",
    orange: "bg-orange-500 border-orange-300",
    blue: "bg-blue-500 border-blue-300",
    yellow: "bg-yellow-500 border-yellow-300",
    red: "bg-red-500 border-red-300",
    gray: "bg-gray-300 border-gray-200",
    active: "bg-orange-500 border-orange-300",
    confirmed: "bg-blue-500 border-blue-300",
    delivered: "bg-emerald-500 border-emerald-300",
    pending: "bg-gray-300 border-gray-200",
    in_transit: "bg-orange-500 border-orange-300",
    default: "bg-gray-300 border-gray-200",
};

function detectCarriers(trackingNumber: string): string[] {
    const num = trackingNumber.trim().replace(/-/g, "");
    if (!num) return [];
    const matches: string[] = [];
    for (const carrier of CARRIERS) {
        if (carrier.prefixes) {
            for (const prefix of carrier.prefixes) {
                if (num.toUpperCase().startsWith(prefix.toUpperCase())) {
                    matches.push(carrier.id);
                    break;
                }
            }
        }
        if (carrier.pattern && carrier.pattern.test(num)) {
            if (!matches.includes(carrier.id)) matches.push(carrier.id);
        }
    }
    return matches;
}

function CarrierLogo({ carrier }: { carrier: Carrier }) {
    const [imgError, setImgError] = useState(false);
    if (imgError) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="font-bold text-sm" style={{ color: carrier.color }}>{carrier.name.split(" ")[0]}</span>
            </div>
        );
    }
    return (
        <img src={carrier.logo} alt={carrier.name} className="max-w-full max-h-full object-contain" onError={() => setImgError(true)} />
    );
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type CarrierTrackingData = {
    found: boolean;
    error?: string;
    message?: string;
    carrierName?: string;
    statusLabel?: string;
    statusColor?: string;
    statusIcon?: string;
    isDelivered?: boolean;
    latestEvent?: { timestamp: string; description: string; location: string } | null;
    events?: { timestamp: string; description: string; location: string }[];
};

const CT_COLOR_MAP: Record<string, { badge: string; dot: string }> = {
    green:  { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    orange: { badge: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
    blue:   { badge: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
    yellow: { badge: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
    red:    { badge: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500" },
    gray:   { badge: "bg-gray-50 text-gray-600 border-gray-200",         dot: "bg-gray-300" },
};

function fmtTs(ts: string) {
    if (!ts) return "";
    try { return new Date(ts.replace(" ", "T")).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return ts; }
}

export default function TrackingPage() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detectedCarriers, setDetectedCarriers] = useState<string[]>([]);
    const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
    const [carrierData, setCarrierData] = useState<CarrierTrackingData | null>(null);
    const [carrierLoading, setCarrierLoading] = useState(false);

    const fetchCarrierTracking = async (q: string) => {
        setCarrierLoading(true);
        setCarrierData(null);
        try {
            const res = await fetch("/api/carrier-tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingNumber: q }),
            });
            if (res.ok) setCarrierData(await res.json());
        } catch {
            setCarrierData({ found: false, message: "Không thể kết nối dịch vụ tracking." });
        } finally {
            setCarrierLoading(false);
        }
    };

    const handleSearch = async () => {
        const q = trackingNumber.trim();
        if (!q) return;
        setLoading(true);
        setSearched(false);
        setTrackingResult(null);
        setCarrierData(null);

        const detected = detectCarriers(q);
        setDetectedCarriers(detected);

        try {
            const res = await fetch(`/api/tracking?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setTrackingResult(data);
                // If not in Fada system, auto-fetch from carrier API
                if (!data.found) {
                    fetchCarrierTracking(q);
                }
            }
        } catch {
            setTrackingResult({ found: false });
            fetchCarrierTracking(q);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const expressCarriers = CARRIERS.filter(c => c.category === "express");
    const airlineCarriers = CARRIERS.filter(c => c.category === "airline");
    const highlighted = searched && detectedCarriers.length > 0
        ? CARRIERS.filter(c => detectedCarriers.includes(c.id))
        : [];

    const fadaFound = trackingResult?.found && trackingResult.booking;

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900 pt-6 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/landing" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors">
                        <span className="inline-block bg-white rounded-xl px-3 py-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/fada-logo.png" alt="Fada Express" style={{ height: "30px", width: "auto", objectFit: "contain" }} />
                        </span>
                    </Link>

                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <Package className="w-4 h-4 text-orange-400" />
                            <span className="text-white/80 text-sm">Tra cứu vận đơn quốc tế</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
                            Theo dõi hàng hóa
                        </h1>
                        <p className="text-white/60 text-sm md:text-lg mb-10">
                            Nhập mã vận đơn (AWB / Tracking number / Mã đơn Fada) để tra cứu hành trình hàng hóa
                        </p>

                        {/* Search box */}
                        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    value={trackingNumber}
                                    onChange={e => { setTrackingNumber(e.target.value); setSearched(false); setTrackingResult(null); setCarrierData(null); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="VD: FE-20240001, 738-12345678, 1Z999AA1..."
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/30 text-base focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={!trackingNumber.trim() || loading}
                                className="bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                                Tra cứu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-4xl mx-auto px-6 -mt-6">

                {/* Loading */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center mb-8">
                        <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Đang tra cứu...</p>
                    </div>
                )}

                {/* FADA Journey Timeline */}
                {!loading && fadaFound && (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                        {/* Header banner */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Hành trình đơn hàng</p>
                                    <p className="text-white font-extrabold text-lg tracking-tight">{trackingResult!.booking!.reference}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${STATUS_COLOR[trackingResult!.booking!.statusColor] || STATUS_COLOR.gray}`}>
                                {trackingResult!.booking!.statusIcon} {trackingResult!.booking!.statusLabel}
                            </span>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-gray-100">
                            <div className="p-4 border-r border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Điểm xuất phát</p>
                                <p className="font-bold text-gray-900 text-sm">{trackingResult!.booking!.origin}</p>
                            </div>
                            <div className="p-4 border-r border-gray-100 md:border-r">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Điểm đến</p>
                                <p className="font-bold text-gray-900 text-sm">{trackingResult!.booking!.destination}</p>
                            </div>
                            <div className="p-4 border-r border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AWB / Tracking</p>
                                <p className="font-bold text-gray-900 text-sm font-mono">{trackingResult!.booking!.awbNumber || "—"}</p>
                            </div>
                            <div className="p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ETA dự kiến</p>
                                <p className="font-bold text-gray-900 text-sm">{formatDateShort(trackingResult!.booking!.eta)}</p>
                            </div>
                        </div>

                        {/* Sender / Recipient */}
                        {(trackingResult!.booking!.senderName || trackingResult!.booking!.recipientName) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100">
                                {trackingResult!.booking!.senderName && (
                                    <div className="p-4 border-r border-gray-100 flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Người gửi</p>
                                            <p className="font-semibold text-gray-800 text-sm">{trackingResult!.booking!.senderName}</p>
                                            {trackingResult!.booking!.senderCity && (
                                                <p className="text-gray-400 text-xs">{trackingResult!.booking!.senderCity}, {trackingResult!.booking!.senderCountry}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {trackingResult!.booking!.recipientName && (
                                    <div className="p-4 flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Người nhận</p>
                                            <p className="font-semibold text-gray-800 text-sm">{trackingResult!.booking!.recipientName}</p>
                                            {trackingResult!.booking!.recipientCity && (
                                                <p className="text-gray-400 text-xs">{trackingResult!.booking!.recipientCity}, {trackingResult!.booking!.recipientCountry}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="p-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Lịch sử hành trình
                            </p>
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-[19px] top-5 bottom-2 w-0.5 bg-gray-100" />
                                <div className="space-y-6">
                                    {(trackingResult!.timeline || []).slice().reverse().map((event, idx) => {
                                        const dotColor = TIMELINE_ICON_COLOR[event.status] || TIMELINE_ICON_COLOR.default;
                                        const isLatest = idx === 0;
                                        return (
                                            <div key={event.id} className="flex items-start gap-4 relative">
                                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border-2 z-10 ${isLatest ? dotColor : "bg-gray-100 border-gray-200"} transition-all`}>
                                                    <span className="text-base">{isLatest ? (trackingResult!.booking!.statusIcon || "📦") : "📋"}</span>
                                                </div>
                                                <div className="flex-1 pt-1.5">
                                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                                        <p className={`font-bold text-sm ${isLatest ? "text-orange-600" : "text-gray-700"}`}>{event.title}</p>
                                                        <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">{formatDate(event.timestamp)}</span>
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{event.description}</p>
                                                    )}
                                                    {event.location && (
                                                        <p className="text-orange-400 text-xs mt-0.5 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {event.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer note */}
                        <div className="bg-orange-50 border-t border-orange-100 px-6 py-3 flex items-center gap-2 text-xs text-orange-700">
                            <span>📞</span>
                            <span>Cần hỗ trợ? Liên hệ <a href="tel:0795666672" className="font-bold underline">0795.6666.72</a> hoặc <a href="mailto:atus@fadalogisticsvn.com" className="font-bold underline">atus@fadalogisticsvn.com</a></span>
                        </div>
                    </div>
                )}

                {/* Not found in Fada system — show carrier links */}
                {!loading && searched && !fadaFound && highlighted.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                        <p className="text-gray-700 font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Phát hiện hãng vận chuyển — Nhấn để tra cứu trực tiếp:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {highlighted.map(carrier => (
                                <a key={carrier.id} href={carrier.trackUrl(trackingNumber.trim())} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-slate-900 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-slate-700 transition-all shadow">
                                    <span>{carrier.name}</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && searched && !fadaFound && highlighted.length === 0 && !carrierLoading && !carrierData?.found && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
                        <span className="text-2xl">🔍</span>
                        <div>
                            <p className="font-semibold text-amber-800 mb-1">Không tìm thấy đơn hàng</p>
                            <p className="text-amber-700 text-sm">Không tìm thấy đơn hàng với mã <strong>"{trackingNumber}"</strong>. Hãy chọn hãng vận chuyển bên dưới để tra cứu trực tiếp, hoặc liên hệ <a href="tel:0795666672" className="underline font-bold">0795.6666.72</a> để được hỗ trợ.</p>
                        </div>
                    </div>
                )}

                {/* Live Carrier Tracking — shown when Fada has no record but carrier API has data */}
                {!loading && searched && !fadaFound && (
                    <>
                        {carrierLoading && (
                            <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 text-center mb-8">
                                <div className="flex items-center justify-center gap-3">
                                    <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                                    <p className="text-sm font-bold text-gray-500">Đang lấy dữ liệu từ hãng vận chuyển...</p>
                                </div>
                            </div>
                        )}

                        {!carrierLoading && carrierData?.error === "no_api_key" && (
                            <div className="bg-white rounded-2xl shadow border border-amber-100 p-6 mb-8 flex items-start gap-4">
                                <KeyRound className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-800 mb-1">Tính năng tracking nâng cao chưa được kích hoạt</p>
                                    <p className="text-sm text-amber-700">
                                        Để xem hành trình chi tiết từ DHL, FedEx, UPS, Yun Express... ngay trên trang này, vui lòng liên hệ Fada Express để được hỗ trợ.
                                    </p>
                                    <div className="flex gap-4 mt-3">
                                        <a href="tel:0795666672" className="text-orange-600 font-bold text-sm">📞 0795.6666.72</a>
                                        <a href="mailto:atus@fadalogisticsvn.com" className="text-orange-600 font-bold text-sm">✉ atus@fadalogisticsvn.com</a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!carrierLoading && carrierData?.found && (
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <span className="text-xl">🛰️</span>
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Live Tracking</p>
                                            <p className="text-white font-extrabold text-lg">{carrierData.carrierName || "Carrier"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${CT_COLOR_MAP[carrierData.statusColor || "gray"]?.badge || ""}`}>
                                            {carrierData.statusIcon} {carrierData.statusLabel}
                                        </span>
                                        <button onClick={() => fetchCarrierTracking(trackingNumber.trim())}
                                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                                            <RefreshCw className="w-3 h-3" /> Làm mới
                                        </button>
                                    </div>
                                </div>

                                {/* Latest event highlight */}
                                {carrierData.latestEvent && (
                                    <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-start gap-3">
                                        <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Cập nhật mới nhất</p>
                                            <p className="font-bold text-gray-900">{carrierData.latestEvent.description}</p>
                                            {carrierData.latestEvent.location && (
                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {carrierData.latestEvent.location}</p>
                                            )}
                                            {carrierData.latestEvent.timestamp && (
                                                <p className="text-xs text-gray-400 mt-0.5">{fmtTs(carrierData.latestEvent.timestamp)}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Full timeline */}
                                {carrierData.events && carrierData.events.length > 0 && (
                                    <div className="p-6">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" /> Lịch sử hành trình ({carrierData.events.length} sự kiện)
                                        </p>
                                        <div className="relative">
                                            <div className="absolute left-[13px] top-4 bottom-2 w-0.5 bg-gray-100" />
                                            <div className="space-y-5">
                                                {carrierData.events.map((ev, idx) => (
                                                    <div key={idx} className="flex items-start gap-4 relative">
                                                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center z-10 ${idx === 0 ? (CT_COLOR_MAP[carrierData.statusColor || "gray"]?.dot || "bg-gray-300") : "bg-gray-100"}`}>
                                                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-white" : "bg-gray-300"}`} />
                                                        </div>
                                                        <div className="flex-1 pt-0.5">
                                                            <p className={`text-sm font-bold ${idx === 0 ? "text-gray-900" : "text-gray-600"}`}>{ev.description}</p>
                                                            {ev.location && (
                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-orange-400" /> {ev.location}</p>
                                                            )}
                                                            {ev.timestamp && <p className="text-xs text-gray-300 mt-0.5">{fmtTs(ev.timestamp)}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-orange-50 border-t border-orange-100 px-6 py-3 text-xs text-orange-700 flex items-center gap-2">
                                    <span>📞</span>
                                    <span>Cần hỗ trợ? Liên hệ <a href="tel:0795666672" className="font-bold underline">0795.6666.72</a> hoặc <a href="mailto:atus@fadalogisticsvn.com" className="font-bold underline">atus@fadalogisticsvn.com</a></span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Carriers */}
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Express */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Chuyển phát nhanh quốc tế</h2>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {expressCarriers.map(carrier => (
                            <CarrierCard key={carrier.id} carrier={carrier} trackingNumber={trackingNumber} isHighlighted={detectedCarriers.includes(carrier.id) && searched} />
                        ))}
                    </div>
                </div>

                {/* Airlines */}
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Plane className="w-4 h-4 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Hàng không quốc tế (Air Cargo)</h2>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        {airlineCarriers.map(carrier => (
                            <CarrierCard key={carrier.id} carrier={carrier} trackingNumber={trackingNumber} isHighlighted={detectedCarriers.includes(carrier.id) && searched} />
                        ))}
                    </div>
                </div>

                {/* Help note */}
                <div className="mt-12 bg-orange-50 border border-orange-100 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-orange-500">💡</span> Hướng dẫn tra cứu
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <p className="font-semibold text-gray-800 mb-1">Nhận diện tự động theo mã vận đơn:</p>
                            <ul className="space-y-1 list-disc pl-4">
                                <li>Mã đơn Fada (VD: <strong>FE-20240001</strong>) → Hiển thị hành trình trực tiếp</li>
                                <li>Bắt đầu bằng <strong>1Z</strong> → UPS</li>
                                <li>Bắt đầu bằng <strong>YT</strong> → Yun Express</li>
                                <li>Bắt đầu bằng <strong>738</strong> → Vietnam Airlines</li>
                                <li>Bắt đầu bằng <strong>160</strong> → Cathay Pacific</li>
                                <li>Bắt đầu bằng <strong>176</strong> → Emirates SkyCargo</li>
                                <li>Bắt đầu bằng <strong>157</strong> → Qatar Airways</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 mb-1">Cần hỗ trợ thêm?</p>
                            <p className="mb-2">Liên hệ đội ngũ Fada Express để được hỗ trợ tra cứu thủ công và cập nhật trạng thái hàng hóa:</p>
                            <a href="tel:0795666672" className="text-orange-500 font-semibold">📞 0795.6666.72</a>
                            <span className="mx-2 text-gray-300">|</span>
                            <a href="mailto:atus@fadalogisticsvn.com" className="text-orange-500 font-semibold">✉ atus@fadalogisticsvn.com</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-6 px-6 text-center text-gray-400 text-sm">
                <Link href="/landing" className="text-orange-500 hover:underline font-medium mr-4">← Về trang chủ Fada Express</Link>
                © {new Date().getFullYear()} CÔNG TY TNHH FADA LOGISTICS
            </footer>
        </div>
    );
}

function CarrierCard({ carrier, trackingNumber, isHighlighted }: {
    carrier: Carrier;
    trackingNumber: string;
    isHighlighted: boolean;
}) {
    const url = trackingNumber.trim() ? carrier.trackUrl(trackingNumber.trim()) : carrier.trackUrl("");

    return (
        <a
            href={trackingNumber.trim() ? url : "#"}
            target={trackingNumber.trim() ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={e => {
                if (!trackingNumber.trim()) { e.preventDefault(); document.querySelector("input")?.focus(); }
            }}
            className={`group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                isHighlighted ? "border-green-400 bg-green-50 shadow-green-100 shadow-md" : "border-gray-100 bg-white hover:border-gray-200"
            }`}
        >
            {isHighlighted && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                </div>
            )}
            <div className="w-16 h-10 mb-3 flex items-center justify-center">
                <CarrierLogo carrier={carrier} />
            </div>
            <p className="font-semibold text-gray-800 text-xs text-center leading-tight mb-1">{carrier.name}</p>
            <p className="text-gray-400 text-[10px] text-center leading-tight">{carrier.description}</p>
            <div className={`mt-3 flex items-center gap-1 text-xs font-semibold transition-colors ${isHighlighted ? "text-green-600" : "text-orange-500 opacity-0 group-hover:opacity-100"}`}>
                {trackingNumber.trim() ? <><ExternalLink className="w-3 h-3" /> Tra cứu</> : <><ChevronRight className="w-3 h-3" /> Chọn</>}
            </div>
        </a>
    );
}
