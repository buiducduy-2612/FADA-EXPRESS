import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const history = await (prisma as any).customerPICHistory.findMany({
            where: { customerId: id },
            include: {
                fromUser:  { select: { id: true, name: true, email: true, avatar: true } },
                toUser:    { select: { id: true, name: true, email: true, avatar: true } },
                changedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("Failed to fetch PIC history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        if (user.role !== "DIRECTOR" && user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { fromUserId, toUserId, note } = await req.json();

        const entry = await (prisma as any).customerPICHistory.create({
            data: {
                customerId:  id,
                fromUserId:  fromUserId || null,
                toUserId:    toUserId   || null,
                changedById: user.id,
                note:        note || null,
            },
            include: {
                fromUser:  { select: { id: true, name: true, email: true } },
                toUser:    { select: { id: true, name: true, email: true } },
                changedBy: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error("Failed to create PIC history entry:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
