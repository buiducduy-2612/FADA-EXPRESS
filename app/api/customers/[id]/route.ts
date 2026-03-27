import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        if (user.role === "SALE") {
            return NextResponse.json({ error: "Forbidden: Sales cannot delete customers" }, { status: 403 });
        }

        // Check for dependencies (bookings)
        const bookingsCount = await (prisma as any).booking.count({ where: { customerId: id } });
        if (bookingsCount > 0) {
            return NextResponse.json({ error: "Cannot delete customer with active bookings" }, { status: 400 });
        }

        await prisma.customer.delete({
            where: { id },
        });
        
        await logActivity(user.id, "DELETE", "CUSTOMER", id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete customer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

        // Check ownership if SALE
        if (user.role === "SALE") {
            if (existing.personInChargeId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const json = await req.json();
        
        // RBAC: Only Director and Admin can transfer PIC or approve customers
        if (json.personInChargeId || json.isApproved !== undefined) {
            if (user.role !== "DIRECTOR" && user.role !== "ADMIN") {
                // Remove these fields if not director/admin to be safe
                delete json.personInChargeId;
                delete json.isApproved;
            }
        }

        const oldPIC = existing.personInChargeId;
        const newPIC = json.personInChargeId;

        const { _picNote, ...updateData } = json;

        const customer = await prisma.customer.update({
            where: { id },
            data: updateData,
        });

        // Record PIC transfer in history when personInChargeId changes
        if (newPIC !== undefined && oldPIC !== newPIC) {
            await (prisma as any).customerPICHistory.create({
                data: {
                    customerId:  id,
                    fromUserId:  oldPIC || null,
                    toUserId:    newPIC || null,
                    changedById: user.id,
                    note:        json._picNote || null,
                },
            });
        }

        await logActivity(user.id, "UPDATE", "CUSTOMER", id, json);

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Failed to update customer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                personInCharge: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const session = await getServerSession(authOptions);
        if ((session?.user as any)?.role === "SALE" && (customer as any).personInChargeId !== (session?.user as any)?.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Failed to fetch customer details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
