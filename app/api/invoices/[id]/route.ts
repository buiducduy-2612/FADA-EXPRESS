import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { booking: { include: { customer: true } } }
        });

        if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Fetch invoice error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const json = await req.json();
        
        // Update Invoice
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: json,
        });

        // Trigger Sync with Booking
        if (updatedInvoice.bookingId) {
            const allInvoices = await prisma.invoice.findMany({
                where: { bookingId: updatedInvoice.bookingId, status: "paid" }
            });

            const totalPaid = allInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
            
            const booking = await prisma.booking.findUnique({
                where: { id: updatedInvoice.bookingId }
            });

            if (booking) {
                let newPaymentStatus = "UNPAID";
                if (totalPaid >= booking.totalRevenue) newPaymentStatus = "PAID";
                else if (totalPaid > 0) newPaymentStatus = "PARTIAL";

                await prisma.booking.update({
                    where: { id: updatedInvoice.bookingId },
                    data: {
                        amountPaid: totalPaid,
                        paymentStatus: newPaymentStatus
                    }
                });
            }
        }

        await logActivity((session.user as any)?.id, "UPDATE", "INVOICE", id, json);

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Update invoice error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
        const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) return NextResponse.json({ error: "NotFound" }, { status: 404 });

        const bookingId = invoice.bookingId;

        await prisma.invoice.delete({ where: { id } });

        // Trigger Sync with Booking
        if (bookingId) {
            const allInvoices = await prisma.invoice.findMany({
                where: { bookingId, status: "paid" }
            });

            const totalPaid = allInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
            
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId }
            });

            if (booking) {
                let newPaymentStatus = "UNPAID";
                if (totalPaid >= (booking.totalRevenue || 0)) newPaymentStatus = "PAID";
                else if (totalPaid > 0) newPaymentStatus = "PARTIAL";

                await prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        amountPaid: totalPaid,
                        paymentStatus: newPaymentStatus
                    }
                });
            }
        }

        await logActivity((session.user as any)?.id, "DELETE", "INVOICE", id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete invoice error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
