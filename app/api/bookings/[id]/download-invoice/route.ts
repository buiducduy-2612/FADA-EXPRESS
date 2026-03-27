import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/pdf";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        const settings = await prisma.appSetting.findFirst();
        const pdfBuffer = await generateInvoicePdf(booking, settings);

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Invoice_${booking.reference}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Download invoice API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
