import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function isValidDate(date: any) {
    return date instanceof Date && !isNaN(date.getTime());
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        
        const existing = await (prisma as any).booking.findUnique({ 
            where: { id },
            include: { customer: true }
        });

        if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

        // RBAC: SALE can only update their own or assigned bookings
        if (user.role === "SALE") {
            if (existing.salesId !== user.id && existing.customer.personInChargeId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const json = await req.json();
        console.log(`[PATCH /api/bookings/${id}] Incoming data:`, JSON.stringify(json));
        
        // Filter out nested objects that Prisma update doesn't accept directly
        const updateData: any = {};
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

        allowedFields.forEach(field => {
            if (json[field] !== undefined) {
                updateData[field] = json[field];
            }
        });

        if (json.packages && Array.isArray(json.packages)) {
            // Delete existing packages and insert new ones
            await (prisma as any).package.deleteMany({ where: { bookingId: id } });
            
            const pkgs = json.packages.map((p: any) => ({
                packagingType: p.packagingType,
                weight: Number(p.weight) || 0,
                length: p.length ? Number(p.length) : null,
                width: p.width ? Number(p.width) : null,
                height: p.height ? Number(p.height) : null,
                description: p.description || null
            }));
            if (pkgs.length > 0) {
                updateData.packages = { create: pkgs };
            }
        }
        
        // Convert date strings to Date objects if present and valid
        const dateFields = ["shipDate", "etd", "eta"];
        dateFields.forEach(field => {
            if (updateData[field]) {
                const d = new Date(updateData[field]);
                if (isValidDate(d)) {
                    updateData[field] = d;
                } else {
                    delete updateData[field]; // Ignore invalid dates
                }
            } else if (updateData[field] === "") {
                updateData[field] = null; // Handle empty string as null
            }
        });
        
        // Get the appropriate salesperson ID
        const targetSalesPersonId = (user.role !== "SALE" && updateData.salesId) ? updateData.salesId : (existing.salesId || user.id);
        
        // Ensure salesId is correct in updateData
        if (updateData.salesId) updateData.salesId = targetSalesPersonId;

        // Calculate commission if revenue or cost changes
        const currentRevenue = (updateData.freightRevenue !== undefined || updateData.surcharge !== undefined || updateData.otherFees !== undefined) 
            ? (Number(updateData.freightRevenue || existing.freightRevenue) + Number(updateData.surcharge || existing.surcharge) + Number(updateData.otherFees || existing.otherFees))
            : Number(existing.totalRevenue);
            
        updateData.totalRevenue = currentRevenue;
        const currentCost = updateData.totalCost !== undefined ? Number(updateData.totalCost) : Number(existing.totalCost);
        const profit = currentRevenue - currentCost;
        
        // Calculate commission based on the target salesperson's rate from DB
        const salesUser = await prisma.user.findUnique({
            where: { id: targetSalesPersonId },
            select: { commissionRate: true }
        });
        const commissionRate = (salesUser?.commissionRate !== undefined) ? Number(salesUser.commissionRate) / 100 : 0.35;
        updateData.commission = profit > 0 ? profit * commissionRate : 0;

        // Create detailed diff for activity log
        const details: any = {};
        Object.keys(updateData).forEach(key => {
            if (JSON.stringify(updateData[key]) !== JSON.stringify(existing[key])) {
                details[key] = {
                    old: existing[key],
                    new: updateData[key]
                };
            }
        });

        console.log(`[PATCH /api/bookings/${id}] Cleaned updateData:`, JSON.stringify(updateData));

        const booking = await (prisma as any).booking.update({
            where: { id },
            data: updateData,
        });

        // Auto-upgrade customer to VIP if total completed revenue > 100M
        const customerId = booking.customerId;
        const allDeliveredBookings = await (prisma as any).booking.findMany({
            where: { customerId, status: "delivered" },
            select: { totalRevenue: true }
        });

        const totalCompletedRevenue = allDeliveredBookings.reduce((sum: number, b: any) => sum + (Number(b.totalRevenue) || 0), 0);

        if (totalCompletedRevenue >= 100000000) {
            await prisma.customer.update({
                where: { id: customerId },
                data: { tier: "VIP" }
            });
        }

        await logActivity(user.id, "UPDATE", "BOOKING", id, details);

        return NextResponse.json(booking);
    } catch (error: any) {
        console.error(`[PATCH /api/bookings/${id}] Internal Error:`, error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const booking = await (prisma as any).booking.findUnique({
            where: { id },
            include: { customer: true, invoices: true, flight: true, sales: true, packages: true },
        });

        if (booking) {
            // Find creator from activity log
            const createActivity = await (prisma as any).activityLog.findFirst({
                where: { entityId: id, entityType: "BOOKING", action: "CREATE" },
                include: { user: { select: { name: true } } }
            });
            (booking as any).creator = createActivity?.user?.name || "Hệ thống";
        }

        return NextResponse.json(booking);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const user = session.user as any;

        // Director or the Sale person in charge can delete? 
        // For now, let's keep it simple: Sale can delete their own, others can delete any.
        if (user.role === "SALE") {
            const existing = await (prisma as any).booking.findUnique({ where: { id } });
            if (!existing || existing.salesId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        await (prisma as any).booking.delete({
            where: { id },
        });
        
        await logActivity(user.id, "DELETE", "BOOKING", id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete booking:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
