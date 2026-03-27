import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [pendingCustomers, pendingBookings] = await Promise.all([
        prisma.customer.count({ where: { isApproved: false } }),
        prisma.booking.count({ where: { approvalStatus: "PENDING" } }),
    ]);

    const pendingBookingList = await prisma.booking.findMany({
        where: { approvalStatus: "PENDING" },
        select: { id: true, reference: true, origin: true, destination: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const pendingCustomerList = await prisma.customer.findMany({
        where: { isApproved: false },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return NextResponse.json(
        { pendingCustomers, pendingBookings, pendingBookingList, pendingCustomerList },
        { headers: { "Cache-Control": "no-store" } }
    );
}
