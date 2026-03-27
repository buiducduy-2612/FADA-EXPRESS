import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DEFAULT_BOOKING_TEMPLATE } from "@/lib/mail";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return null;
    }
    return session;
}

export async function GET() {
    try {
        let templates = await (prisma as any).emailTemplate.findMany({
            orderBy: { name: "asc" }
        });

        if (templates.length === 0) {
            const defaultTemplate = await (prisma as any).emailTemplate.create({
                data: {
                    name: "INVOICE",
                    subject: "Hoá đơn đơn hàng {{reference}}",
                    body: DEFAULT_BOOKING_TEMPLATE,
                    type: "INVOICE"
                }
            });
            templates = [defaultTemplate];
        }

        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await verifyAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, subject, body: htmlBody, type } = body;

        const template = await (prisma as any).emailTemplate.create({
            data: { name, subject, body: htmlBody, type }
        });
        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await verifyAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, name, subject, body: htmlBody, type } = body;

        const template = await (prisma as any).emailTemplate.update({
            where: { id },
            data: { name, subject, body: htmlBody, type }
        });
        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}
