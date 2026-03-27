import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create a customer
    const customer = await prisma.customer.upsert({
        where: { email: "contact@techlogix.com" },
        update: {},
        create: {
            name: "TechLogix Global Solutions",
            email: "contact@techlogix.com",
            contact: "Sarah Jenkins",
            phone: "+84 902 123 456",
            industry: "Technology",
            taxCode: "0102938475",
        },
    });

    // Create a booking
    await (prisma as any).booking.create({
        data: {
            reference: "BKG-2901",
            awbNumber: "160-29381",
            customerId: customer.id,
            origin: "SGN",
            destination: "SIN",
            status: "departed",
            approvalStatus: "APPROVED",
            weight: 450,
            pieces: 12,
            shipDate: new Date("2026-03-04T14:20:00Z"),
        },
    });

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
