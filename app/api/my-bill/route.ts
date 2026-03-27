import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const role = user.role;

        // Build where clause based on role
        let whereClause: any = {};

        if (role === "SALE") {
            // SALE can only see bookings they are assigned to
            whereClause.salesId = user.id;
        }
        // ADMIN, DIRECTOR, CS, ACCOUNTING see all bookings

        const bookings = await (prisma as any).booking.findMany({
            where: whereClause,
            include: {
                customer: true,
                sales: true,
                packages: true,
                invoices: true
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch billed bookings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
