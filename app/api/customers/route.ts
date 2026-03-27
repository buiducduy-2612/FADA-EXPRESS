import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

      export async function GET(req: Request) {
          try {
              const session = await getServerSession(authOptions);
              if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      
              const user = session.user as any;
        let whereClause: any = {};
        
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get("status");

        // SALE can only see customers they created/are assigned to
        if (user.role === "SALE") {
            whereClause.OR = [
                { userId: user.id },
                { personInChargeId: user.id }
            ];
        }

        // Filter by approval status
        if (statusParam === "pending") {
            whereClause.isApproved = false;
        } else {
            // Default to only showing approved customers unless specifically asking for pending
            whereClause.isApproved = true;
        }

        const customers = await (prisma as any).customer.findMany({
            where: whereClause,
            include: {
                sales: {
                    select: { id: true, name: true, email: true }
                },
                personInCharge: {
                    select: { id: true, name: true, email: true }
                },
                bookings: {
                    select: { totalRevenue: true, totalCost: true, amountPaid: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error("Fetch customers error:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const json = await req.json();
        
        const { name, email, phone, contact, industry, taxCode, tier, personInChargeId, address } = json;
        
        const customerData = { 
            name, email, phone, contact, industry, taxCode, address,
            tier: tier || "POTENTIAL",
            personInChargeId: personInChargeId || user.id,
            isApproved: user.role === "DIRECTOR" || user.role === "ADMIN", // Director and Admin auto-approve
        };

        const customer = await prisma.customer.create({
            data: customerData,
        });

        await logActivity(user.id, "CREATE", "CUSTOMER", customer.id, customer);

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Create customer error:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
