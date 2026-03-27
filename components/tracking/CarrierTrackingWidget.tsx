"use client";

import { useState, useCallback } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, MapPin, Clock, ExternalLink, KeyRound } from "lucide-react";

type TrackingEvent = {
    timestamp: string;
    description: string;
    location: string;
};

type TrackingData = {
    found: boolean;
    error?: string;
    message?: string;
    carrierName?: string;
    trackingNumber?: string;
    statusCode?: number;
    statusLabel?: string;
    statusColor?: string;
    statusIcon?: string;
    isDelivered?: boolean;
    latestEvent?: TrackingEvent | null;
    events?: TrackingEvent[];
    autoUpdated?: boolean;
};

const COLOR_MAP: Record<string, { badge: string; dot: string; line: string }> = {
    green:  { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", line: "bg-emerald-200" },
    orange: { badge: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500",  line: "bg-orange-200" },
    blue:   { badge: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500",    line: "bg-blue-200" },
    yellow: { badge: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500",  line: "bg-yellow-200" },
    red:    { badge: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500",     line: "bg-red-200" },
    gray:   { badge: "bg-gray-50 text-gray-600 border-gray-200",         dot: "bg-gray-300",    line: "bg-gray-200" },
};

function formatTs(ts: string) {
    if (!ts) return "";
    try {
        const d = new Date(ts.replace(" ", "T"));
        return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return ts;
    }
}

type Props = {
    awbNumber: string;
    bookingId?: string;
    carrierTrackUrl?: string;
    onDelivered?: () => void;
    compact?: boolean;
};

export default function CarrierTrackingWidget({ awbNumber, bookingId, carrierTrackUrl, onDelivered, compact = false }: Props) {
    const [data, setData] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const fetchTracking = useCallback(async () => {
        if (!awbNumber) return;
        setLoading(true);
        try {
            const res = await fetch("/api/carrier-tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingNumber: awbNumber, bookingId }),
            });
            const result = await res.json();
            setData(result);
            setLoaded(true);
            if (result.isDelivered && result.autoUpdated && onDelivered) {
                onDelivered();
            }
        } catch {
            setData({ found: false, message: "Không thể kết nối đến dịch vụ tracking." });
            setLoaded(true);
        } finally {
            setLoading(false);
        }
    }, [awbNumber, bookingId, onDelivered]);

    const colors = COLOR_MAP[data?.statusColor || "gray"];

    return (
        <div className={compact ? "" : "mt-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl md:rounded-3xl overflow-hidden"}>
            {/* Header bar */}
            <div className={`flex items-center justify-between gap-3 flex-wrap ${compact ? "mb-3" : "bg-zinc-50 dark:bg-zinc-800/40 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"}`}>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        🛰️ Live Carrier Tracking
                    </span>
                    {data?.carrierName && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                            {data.carrierName}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {carrierTrackUrl && (
                        <a href={carrierTrackUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Xem tại hãng
                        </a>
                    )}
                    <button
                        onClick={fetchTracking}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-3 py-1.5 rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                        {loaded ? "Làm mới" : "Tải tracking"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={compact ? "" : "p-5"}>

                {/* No API Key */}
                {data?.error === "no_api_key" && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <KeyRound className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 mb-1">Chưa cấu hình API Key</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Để xem tracking trực tiếp từ hãng, bạn cần:
                                <br />1. Đăng ký tài khoản miễn phí tại <a href="https://api.17track.net" target="_blank" rel="noopener noreferrer" className="font-bold underline">api.17track.net</a>
                                <br />2. Lấy API key từ dashboard
                                <br />3. Thêm vào biến môi trường: <code className="bg-amber-100 px-1 rounded font-mono text-amber-900">SEVENTEEN_TRACK_API_KEY=your_key</code>
                            </p>
                        </div>
                    </div>
                )}

                {/* Not loaded yet */}
                {!loaded && !loading && !data && (
                    <div className="text-center py-6 text-zinc-400">
                        <p className="text-xs font-medium">Nhấn <strong className="text-zinc-600">"Tải tracking"</strong> để lấy dữ liệu vận chuyển thực từ hãng</p>
                    </div>
                )}

                {/* Loading spinner */}
                {loading && (
                    <div className="flex items-center justify-center gap-3 py-8">
                        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Đang lấy dữ liệu từ hãng...</p>
                    </div>
                )}

                {/* Not found */}
                {!loading && loaded && data && !data.found && data.error !== "no_api_key" && (
                    <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">{data.message || "Không tìm thấy thông tin tracking"}</p>
                            <p className="text-xs text-zinc-400 mt-1">Hãng vận chuyển chưa cập nhật hoặc mã tracking chưa hợp lệ. Thử lại sau ít phút.</p>
                        </div>
                    </div>
                )}

                {/* Found tracking data */}
                {!loading && loaded && data?.found && (
                    <div>
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold mb-5 ${colors.badge}`}>
                            <span>{data.statusIcon}</span>
                            <span>{data.statusLabel}</span>
                            {data.isDelivered && <CheckCircle2 className="w-4 h-4" />}
                        </div>

                        {data.autoUpdated && (
                            <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Trạng thái đơn hàng đã được tự động cập nhật thành "Đã giao hàng"
                            </div>
                        )}

                        {/* Latest event highlight */}
                        {data.latestEvent && (
                            <div className="mb-5 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl">
                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Cập nhật mới nhất
                                </p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">{data.latestEvent.description}</p>
                                {data.latestEvent.location && (
                                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-orange-400" /> {data.latestEvent.location}
                                    </p>
                                )}
                                {data.latestEvent.timestamp && (
                                    <p className="text-[10px] text-zinc-400 mt-1">{formatTs(data.latestEvent.timestamp)}</p>
                                )}
                            </div>
                        )}

                        {/* Events timeline */}
                        {data.events && data.events.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Lịch sử hành trình ({data.events.length} sự kiện)</p>
                                <div className="relative">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                                    <div className="space-y-4">
                                        {data.events.map((ev, idx) => (
                                            <div key={idx} className="flex items-start gap-4 relative">
                                                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center z-10 ${idx === 0 ? colors.dot : "bg-zinc-200 dark:bg-zinc-700"}`}>
                                                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-white" : "bg-zinc-400 dark:bg-zinc-500"}`} />
                                                </div>
                                                <div className="flex-1 pt-0.5">
                                                    <p className={`text-xs font-bold ${idx === 0 ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-300"}`}>
                                                        {ev.description}
                                                    </p>
                                                    {ev.location && (
                                                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-2.5 h-2.5" /> {ev.location}
                                                        </p>
                                                    )}
                                                    {ev.timestamp && (
                                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-500 mt-0.5">{formatTs(ev.timestamp)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
