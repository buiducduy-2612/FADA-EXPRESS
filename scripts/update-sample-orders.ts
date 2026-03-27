import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating all sample orders to have beautiful nice numbers...");
    const bookings = await prisma.booking.findMany();

    const baseNumbers = [5000000, 8500000, 12000000, 15000000, 24000000, 32000000, 45000000, 18000000];
    
    for (const booking of bookings) {
        const randomRevenue = baseNumbers[Math.floor(Math.random() * baseNumbers.length)];
        const randomCost = randomRevenue * 0.7; // 30% margin
        const paidAmount = booking.paymentStatus === "PARTIAL" ? randomRevenue * 0.5 : 0;
        
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                totalRevenue: randomRevenue,
                totalCost: randomCost,
                freightRevenue: randomRevenue * 0.8,
                surcharge: randomRevenue * 0.1,
                otherFees: randomRevenue * 0.1,
                amountPaid: paidAmount
            }
        });
        console.log(`Updated booking ${booking.reference} with revenue ${randomRevenue}`);
    }
    
    console.log("Finished updating sample orders.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
