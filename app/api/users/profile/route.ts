import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await prisma.user.findUnique({
            where: { id: (session.user as any)?.id },
            select: { id: true, name: true, email: true, role: true, avatar: true } as any
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, email, password, avatar } = body;
        const currentUserId = (session.user as any)?.id;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: currentUserId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, avatar: true } as any
        });

        await logActivity(currentUserId, "UPDATE", "USER", currentUserId, { name, email, hasAvatar: !!avatar, selfUpdate: true });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Self update user error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
