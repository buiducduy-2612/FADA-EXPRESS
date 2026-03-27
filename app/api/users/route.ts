import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function verifyManagement() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "ADMIN" && role !== "DIRECTOR")) {
        return null; 
    }
    return session;
}

export async function GET(req: Request) {
    try {
        const session = await verifyManagement();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");

        const where: any = {};
        if (role) where.role = role;

        const users = await prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatar: true, createdAt: true },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await verifyManagement();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, email, password, role, commissionRate, avatar } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                avatar,
                commissionRate: commissionRate ? Number(commissionRate) : 0
            },
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatar: true }
        });

        await logActivity((session.user as any)?.id, "CREATE", "USER", user.id, { name, email, role, commissionRate });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await verifyManagement();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, name, email, password, role, commissionRate, avatar } = body;

        if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (commissionRate !== undefined) updateData.commissionRate = Number(commissionRate);
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatar: true }
        });

        await logActivity((session.user as any)?.id, "UPDATE", "USER", user.id, { name, email, role, commissionRate });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await verifyManagement();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        await logActivity((session.user as any)?.id, "DELETE", "USER", id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
