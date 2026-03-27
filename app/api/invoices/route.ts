import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const customerId = searchParams.get("customerId");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        let whereClause: any = {};

        // SALE can only see invoices for their assigned customers
        if (user.role === "SALE") {
            whereClause.booking = { customer: { personInChargeId: user.id } };
        }

        if (customerId) {
            whereClause.booking = { ...whereClause.booking, customerId: customerId };
        }

        if (status && status !== "all") {
            whereClause.status = status;
        }

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt.gte = new Date(startDate);
            if (endDate) whereClause.createdAt.lte = new Date(endDate);
        }

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                booking: {
                    include: {
                        customer: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const json = await req.json();
        const invoice = await prisma.invoice.create({
            data: json,
        });

        // Trigger Sync with Booking
        if (invoice.bookingId) {
            const allInvoices = await prisma.invoice.findMany({
                where: { bookingId: invoice.bookingId, status: "paid" }
            });

            const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const booking = await prisma.booking.findUnique({ where: { id: invoice.bookingId } });
            
            if (booking) {
                let newPaymentStatus = "UNPAID";
                if (totalPaid >= booking.totalRevenue) newPaymentStatus = "PAID";
                else if (totalPaid > 0) newPaymentStatus = "PARTIAL";

                await prisma.booking.update({
                    where: { id: invoice.bookingId },
                    data: {
                        amountPaid: totalPaid,
                        paymentStatus: newPaymentStatus
                    }
                });
            }
        }

        await logActivity((session.user as any)?.id, "CREATE", "INVOICE", invoice.id, json);

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
