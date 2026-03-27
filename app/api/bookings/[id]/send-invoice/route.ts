import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/email-service";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => ({}));
        const emails = body.emails || [];

        const result = await sendInvoiceEmail(id, emails);

        if (result.success) {
            return NextResponse.json({ message: "Email sent successfully" });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error("Send invoice API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
