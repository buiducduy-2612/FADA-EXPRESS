import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const roles = await (prisma as any).role.findMany({
            include: { _count: { select: { users: true } } }
        });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const json = await req.json();
        const role = await (prisma as any).role.create({
            data: json
        });
        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const json = await req.json();
        const { id, ...data } = json;
        const role = await (prisma as any).role.update({
            where: { id },
            data
        });
        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}
