import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fullName, email, phone, company, origin, destination, cargoType, weight, message } = body;

        if (!fullName || !email || !phone) {
            return NextResponse.json({ error: "Vui lòng điền đầy đủ họ tên, email và số điện thoại" }, { status: 400 });
        }

        const lead = await (prisma as any).contactLead.create({
            data: {
                fullName,
                email,
                phone,
                company: company || null,
                origin: origin || null,
                destination: destination || null,
                cargoType: cargoType || null,
                weight: weight || null,
                message: message || null,
                status: "NEW",
            },
        });

        return NextResponse.json({ success: true, id: lead.id });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json({ error: "Gửi thông tin thất bại. Vui lòng thử lại." }, { status: 500 });
    }
}
