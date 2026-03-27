import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== "all") where.status = status;

        // SALE role: only see leads assigned to them OR unassigned leads
        if (user.role === "SALE") {
            where.OR = [
                { assignedToId: user.id },
                { assignedToId: null }
            ];
        }

        const leads = await (prisma as any).contactLead.findMany({
            where,
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error("Fetch leads error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, status, assignedToId } = body;

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const updateData: any = {};
        if (status) updateData.status = status;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

        const lead = await (prisma as any).contactLead.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } }
            }
        });

        return NextResponse.json(lead);
    } catch (error) {
        console.error("Update lead error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        if (user.role === "SALE") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await (prisma as any).contactLead.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
