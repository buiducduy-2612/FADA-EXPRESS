import prisma from "@/lib/prisma";

export async function logActivity(
    userId: string,
    action: "CREATE" | "UPDATE" | "DELETE",
    entityType: "CUSTOMER" | "BOOKING" | "QUOTE" | "INVOICE" | "USER",
    entityId: string,
    details?: any
) {
    try {
        await (prisma as any).activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ? JSON.stringify(details) : null,
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
