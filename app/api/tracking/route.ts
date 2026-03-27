import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    pending:     { label: "Chờ xử lý",       icon: "🕐", color: "gray"   },
    confirmed:   { label: "Đã xác nhận",      icon: "✅", color: "blue"   },
    processing:  { label: "Đang xử lý",       icon: "⚙️", color: "blue"   },
    active:      { label: "Đã tiếp nhận",     icon: "📦", color: "orange" },
    in_transit:  { label: "Đang vận chuyển",  icon: "✈️", color: "orange" },
    out_for_delivery: { label: "Đang giao hàng", icon: "🚚", color: "orange" },
    customs:     { label: "Đang thông quan",  icon: "🛃", color: "yellow" },
    delivered:   { label: "Đã giao hàng",     icon: "🎉", color: "green"  },
    returned:    { label: "Đã hoàn hàng",     icon: "↩️", color: "red"    },
    cancelled:   { label: "Đã hủy",           icon: "❌", color: "red"    },
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();

        if (!q) {
            return NextResponse.json({ error: "Missing tracking number" }, { status: 400 });
        }

        const qLower = q.toLowerCase();
        const booking = await (prisma as any).booking.findFirst({
            where: {
                OR: [
                    { awbNumber: q },
                    { reference: q },
                    { awbNumber: qLower },
                    { reference: qLower },
                ]
            },
            select: {
                id: true,
                reference: true,
                awbNumber: true,
                origin: true,
                destination: true,
                status: true,
                approvalStatus: true,
                shipper: true,
                cargoType: true,
                service: true,
                pieces: true,
                weight: true,
                shipDate: true,
                etd: true,
                eta: true,
                senderName: true,
                senderCountry: true,
                senderCity: true,
                recipientName: true,
                recipientCountry: true,
                recipientCity: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!booking) {
            return NextResponse.json({ found: false });
        }

        const activities = await (prisma as any).activityLog.findMany({
            where: {
                entityType: "BOOKING",
                entityId: booking.id
            },
            orderBy: { createdAt: "asc" }
        });

        const timeline = [
            {
                id: "created",
                timestamp: booking.createdAt,
                status: "confirmed",
                title: "Đơn hàng được tạo",
                description: `Đơn hàng ${booking.reference} đã được tiếp nhận và xử lý bởi Fada Express.`,
                location: booking.origin || "",
            },
            ...activities.map((a: any) => {
                const changes = a.changes ? (typeof a.changes === "string" ? JSON.parse(a.changes) : a.changes) : {};
                const newStatus = changes?.status?.to || changes?.approvalStatus?.to;
                const statusInfo = newStatus ? STATUS_LABELS[newStatus] : null;

                let title = "Cập nhật trạng thái";
                let description = "";

                if (changes?.status?.to) {
                    const info = STATUS_LABELS[changes.status.to];
                    title = info?.label || changes.status.to;
                    description = `Trạng thái thay đổi từ "${STATUS_LABELS[changes.status.from]?.label || changes.status.from}" sang "${info?.label || changes.status.to}".`;
                } else if (changes?.approvalStatus?.to === "APPROVED") {
                    title = "Đơn hàng được duyệt";
                    description = "Đơn hàng đã được xác nhận và duyệt bởi đội ngũ Fada Express.";
                } else if (changes?.awbNumber?.to) {
                    title = "Cập nhật AWB";
                    description = `Số AWB được cấp: ${changes.awbNumber.to}`;
                } else if (a.action === "UPDATE") {
                    title = "Cập nhật thông tin";
                    description = "Thông tin đơn hàng đã được cập nhật.";
                }

                return {
                    id: a.id,
                    timestamp: a.createdAt,
                    status: newStatus || "active",
                    title,
                    description,
                    location: "",
                };
            })
        ];

        const currentStatusInfo = STATUS_LABELS[booking.status] || { label: booking.status, icon: "📦", color: "gray" };

        return NextResponse.json({
            found: true,
            booking: {
                reference: booking.reference,
                awbNumber: booking.awbNumber,
                origin: booking.origin,
                destination: booking.destination,
                status: booking.status,
                statusLabel: currentStatusInfo.label,
                statusIcon: currentStatusInfo.icon,
                statusColor: currentStatusInfo.color,
                approvalStatus: booking.approvalStatus,
                service: booking.service,
                pieces: booking.pieces,
                weight: booking.weight,
                shipDate: booking.shipDate,
                etd: booking.etd,
                eta: booking.eta,
                senderName: booking.senderName,
                senderCity: booking.senderCity,
                senderCountry: booking.senderCountry,
                recipientName: booking.recipientName,
                recipientCity: booking.recipientCity,
                recipientCountry: booking.recipientCountry,
            },
            timeline,
        });
    } catch (error) {
        console.error("Tracking error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
