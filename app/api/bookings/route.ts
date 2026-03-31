import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        let whereClause: any = {};

        // SALE can only see bookings they created or their customers' bookings
        if (user.role === "SALE") {
            whereClause.OR = [
                { salesId: user.id },
                { customer: { personInChargeId: user.id } },
                { customer: { userId: user.id } }
            ];
        }
        // CS, ACCOUNTING, DIRECTOR, ADMIN see all

        const bookings = await (prisma as any).booking.findMany({
            where: whereClause,
            include: {
                customer: true,
                invoices: true,
                flight: true,
                sales: true
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const json = await req.json();
        
        // Filter out non-scalar fields for Prisma create
        const allowedFields = [
            "reference", "awbNumber", "customerId", "salesId", "flightId", 
            "origin", "destination", "status", "approvalStatus", "paymentStatus",
            "pieces", "weight", "chargeableWeight", "volume", 
            "freightRevenue", "surcharge", "otherFees", "otherFeeLabel", "totalRevenue", "totalCost",
            "commission", "shipper", "cargoType", "service", "description",
            "shipDate", "etd", "eta",
            "senderName", "senderPhone", "senderCountry", "senderState", "senderCity", "senderZip", "senderAddress",
            "recipientName", "recipientPhone", "recipientCountry", "recipientState", "recipientCity", "recipientZip", "recipientAddress"
        ];

        // Assign salesperson: Admin can override, others default to self
        const targetSalesPersonId = (user.role !== "SALE" && json.salesId) ? json.salesId : user.id;

        const bookingData: any = {
            salesId: targetSalesPersonId,
            approvalStatus: user.role === "SALE" ? "PENDING" : "APPROVED"
        };

        if (json.packages && Array.isArray(json.packages)) {
            const pkgs = json.packages.map((p: any) => ({
                packagingType: p.packagingType,
                weight: Number(p.weight) || 0,
                length: p.length ? Number(p.length) : null,
                width: p.width ? Number(p.width) : null,
                height: p.height ? Number(p.height) : null,
                description: p.description || null
            }));
            if (pkgs.length > 0) {
                bookingData.packages = { create: pkgs };
            }
        }

        allowedFields.forEach(field => {
            if (json[field] !== undefined) {
                bookingData[field] = json[field];
            }
        });

        // Ensure salesId is correct in data
        bookingData.salesId = targetSalesPersonId;

        // Convert date strings to Date objects if present and valid
        const dateFields = ["shipDate", "etd", "eta"];
        dateFields.forEach(field => {
            if (bookingData[field]) {
                const d = new Date(bookingData[field]);
                if (!isNaN(d.getTime())) {
                    bookingData[field] = d;
                } else {
                    delete bookingData[field];
                }
            } else if (bookingData[field] === "") {
                bookingData[field] = null;
            }
        });

        // Calculate commission based on the ASSIGNED salesperson's rate
        const salesUser = await prisma.user.findUnique({
            where: { id: targetSalesPersonId },
            select: { commissionRate: true }
        });
        const commissionRate = (salesUser?.commissionRate !== undefined) ? Number(salesUser.commissionRate) / 100 : 0.35;
        const revenue = Number(bookingData.totalRevenue) || 0;
        const cost = Number(bookingData.totalCost) || 0;
        const profit = revenue - cost;
        bookingData.commission = profit > 0 ? profit * commissionRate : 0;

        const booking = await (prisma as any).booking.create({
            data: bookingData,
        });

        // Auto-upgrade customer to CONVERTED if they were POTENTIAL
        const customer = await prisma.customer.findUnique({
            where: { id: bookingData.customerId },
            select: { tier: true }
        });

        if (customer && (customer.tier === "POTENTIAL" || !customer.tier)) {
            await prisma.customer.update({
                where: { id: bookingData.customerId },
                data: { tier: "CONVERTED" }
            });
        }

        await logActivity(user.id, "CREATE", "BOOKING", booking.id, bookingData);

        return NextResponse.json(booking);
    } catch (error: any) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
