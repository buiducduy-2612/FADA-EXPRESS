import { NextResponse } from "next/server";

const API_KEY = process.env.SEVENTEEN_TRACK_API_KEY;
const REGISTER_URL = "https://api.17track.net/track/v2/register";
const GET_INFO_URL = "https://api.17track.net/track/v2/gettrackinfo";

// Status code mapping from 17Track
const STATUS_MAP: Record<number, { label: string; color: string; icon: string; isDelivered: boolean }> = {
    0:   { label: "Chưa tìm thấy thông tin",     color: "gray",    icon: "🔍", isDelivered: false },
    10:  { label: "Đang vận chuyển",              color: "orange",  icon: "✈️", isDelivered: false },
    20:  { label: "Không tìm thấy",               color: "red",     icon: "❌", isDelivered: false },
    30:  { label: "Sẵn sàng lấy hàng",            color: "blue",    icon: "📦", isDelivered: false },
    35:  { label: "Giao hàng không thành công",   color: "red",     icon: "⚠️", isDelivered: false },
    40:  { label: "Đã giao hàng thành công",      color: "green",   icon: "✅", isDelivered: true  },
    50:  { label: "Có sự cố / Ngoại lệ",          color: "red",     icon: "🚨", isDelivered: false },
    60:  { label: "Đã xuất phát",                 color: "blue",    icon: "🛫", isDelivered: false },
    65:  { label: "Đang transit quốc tế",         color: "orange",  icon: "🌐", isDelivered: false },
    70:  { label: "Đang thông quan hải quan",     color: "yellow",  icon: "🛃", isDelivered: false },
    80:  { label: "Đã đến sân bay đích",          color: "blue",    icon: "🛬", isDelivered: false },
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { trackingNumber, bookingId } = body;

        if (!trackingNumber) {
            return NextResponse.json({ error: "Missing tracking number" }, { status: 400 });
        }

        if (!API_KEY) {
            return NextResponse.json({
                error: "no_api_key",
                message: "Chưa cấu hình API key 17Track. Vui lòng thêm SEVENTEEN_TRACK_API_KEY vào biến môi trường.",
            }, { status: 200 });
        }

        // Step 1: Register the tracking number
        await fetch(REGISTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "17token": API_KEY,
            },
            body: JSON.stringify([{ number: trackingNumber, carrier: 0 }]),
        });

        // Step 2: Get tracking info
        const infoRes = await fetch(GET_INFO_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "17token": API_KEY,
            },
            body: JSON.stringify([{ number: trackingNumber }]),
        });

        if (!infoRes.ok) {
            return NextResponse.json({ error: "Failed to fetch from 17Track" }, { status: 502 });
        }

        const infoData = await infoRes.json();

        if (infoData.code !== 0) {
            return NextResponse.json({ error: "17Track API error", details: infoData }, { status: 502 });
        }

        const accepted = infoData.data?.accepted || [];
        if (accepted.length === 0) {
            return NextResponse.json({ found: false, message: "Không tìm thấy thông tin tracking." });
        }

        const track = accepted[0]?.track;
        if (!track) {
            return NextResponse.json({ found: false, message: "Chưa có dữ liệu vận chuyển." });
        }

        const statusCode: number = track.e ?? 0;
        const statusInfo = STATUS_MAP[statusCode] || STATUS_MAP[0];

        const events: { timestamp: string; description: string; location: string }[] = (track.z1 || []).map((e: any) => ({
            timestamp: e.z || "",
            description: e.a || "",
            location: e.c || "",
        }));

        // Auto-update booking status if delivered
        let autoUpdated = false;
        if (statusInfo.isDelivered && bookingId) {
            try {
                await fetch(`${process.env.NEXTAUTH_URL || ""}/api/bookings/${bookingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "delivered" }),
                });
                autoUpdated = true;
            } catch {
                // silently fail, best effort
            }
        }

        return NextResponse.json({
            found: true,
            carrierName: track.w1 || "Unknown Carrier",
            trackingNumber,
            statusCode,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            statusIcon: statusInfo.icon,
            isDelivered: statusInfo.isDelivered,
            latestEvent: track.z0 ? {
                timestamp: track.z0.z || "",
                description: track.z0.a || "",
                location: track.z0.c || "",
            } : null,
            events: events.reverse(), // newest first
            autoUpdated,
        });

    } catch (error) {
        console.error("Carrier tracking error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
