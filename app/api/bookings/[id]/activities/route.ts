import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const activities = await (prisma as any).activityLog.findMany({
            where: {
                entityType: "BOOKING",
                entityId: id
            },
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Failed to fetch booking activities:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
