import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const where: any = {};
        if ((session.user as any)?.role === "SALE") {
            where.userId = (session.user as any).id;
        }

        const activities = await (prisma as any).activityLog.findMany({
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 100, // Limit to recent 100 for now
        });
        return NextResponse.json(activities);
    } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
