const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database with realistic air freight data...");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const salePassword = await bcrypt.hash("sale123", 10);
    const sale2Password = await bcrypt.hash("sale456", 10);
    const sale3Password = await bcrypt.hash("sale789", 10);
    const accPassword = await bcrypt.hash("acc123", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@logictis.com" },
        update: {},
        create: { name: "Nguyen Van Admin", email: "admin@logictis.com", password: adminPassword, role: "ADMIN", commissionRate: 0 }
    });

    const sale1 = await prisma.user.upsert({
        where: { email: "sale@logictis.com" },
        update: {},
        create: { name: "Tran Thi Lan", email: "sale@logictis.com", password: salePassword, role: "SALE", commissionRate: 3 }
    });

    const sale2 = await prisma.user.upsert({
        where: { email: "sale2@logictis.com" },
        update: {},
        create: { name: "Le Minh Tuan", email: "sale2@logictis.com", password: sale2Password, role: "SALE", commissionRate: 3 }
    });

    const sale3 = await prisma.user.upsert({
        where: { email: "sale3@logictis.com" },
        update: {},
        create: { name: "Pham Quoc Hung", email: "sale3@logictis.com", password: sale3Password, role: "SALE", commissionRate: 2.5 }
    });

    const acc = await prisma.user.upsert({
        where: { email: "accounting@logictis.com" },
        update: {},
        create: { name: "Hoang Thi Mai", email: "accounting@logictis.com", password: accPassword, role: "ACCOUNTING", commissionRate: 0 }
    });

    console.log("Users created.");

    const customersData = [
        { name: "Samsung Vina Co. Ltd", email: "logistics@samsung-vina.com", phone: "+84 28 3823 4567", industry: "Electronics", status: "active", tier: "VIP", isApproved: true, taxCode: "0301452888", address: "16 Pho Quang, Tan Binh, HCMC" },
        { name: "Nike Vietnam Manufacturing", email: "supply@nike-vn.com", phone: "+84 28 3722 9900", industry: "Apparel", status: "active", tier: "VIP", isApproved: true, taxCode: "0302456789", address: "VSIP II, Binh Duong" },
        { name: "Apple Supply Chain VN", email: "apac@apple-supply.com", phone: "+84 28 3910 5500", industry: "Technology", status: "active", tier: "VIP", isApproved: true, taxCode: "0303567890", address: "Saigon Hi-Tech Park, District 9" },
        { name: "LG Electronics Haiphong", email: "export@lg-haiphong.com", phone: "+84 225 3741 888", industry: "Electronics", status: "active", tier: "PREMIUM", isApproved: true, taxCode: "0200789123", address: "Trang Due IP, Haiphong" },
        { name: "Foxconn Industrial Vietnam", email: "logistics@foxconn-vn.com", phone: "+84 28 3729 1100", industry: "Manufacturing", status: "active", tier: "PREMIUM", isApproved: true, taxCode: "0304123456", address: "Que Vo IP, Bac Ninh" },
        { name: "H&M Sourcing Vietnam", email: "hm-sourcing@hm.com", phone: "+84 28 3820 6600", industry: "Apparel", status: "active", tier: "PREMIUM", isApproved: true, taxCode: "0305234567", address: "30 Ton Duc Thang, D1, HCMC" },
        { name: "BASF Vietnam Ltd", email: "logistics@basf-vn.com", phone: "+84 28 3910 7700", industry: "Chemicals", status: "active", tier: "REGULAR", isApproved: true, taxCode: "0306345678", address: "75 Hoang Dieu, D4, HCMC" },
        { name: "Adidas Sourcing HAN", email: "freight@adidas-han.com", phone: "+84 24 3579 8800", industry: "Apparel", status: "active", tier: "PREMIUM", isApproved: true, taxCode: "0100456789", address: "Me Linh Point, Hanoi" },
        { name: "Panasonic Vietnam", email: "export@panasonic-vn.com", phone: "+84 221 3765 999", industry: "Electronics", status: "active", tier: "REGULAR", isApproved: true, taxCode: "0201567890", address: "Thang Long IP, Hanoi" },
        { name: "Brother Industries VN", email: "vn-logistics@brother.com", phone: "+84 28 3877 6600", industry: "Electronics", status: "active", tier: "REGULAR", isApproved: true, taxCode: "0307678901", address: "Song Than IP, Binh Duong" },
        { name: "Zara Inditex Sourcing", email: "sourcing@zara-vn.com", phone: "+84 28 3910 4400", industry: "Apparel", status: "active", tier: "VIP", isApproved: true, taxCode: "0308789012", address: "Vincom Center, D1, HCMC" },
        { name: "Unilever Vietnam", email: "export@unilever.com.vn", phone: "+84 28 3410 5678", industry: "FMCG", status: "active", tier: "VIP", isApproved: true, taxCode: "0309890123", address: "156 Nguyen Luong Bang, D7, HCMC" },
        { name: "Decathlon Vietnam", email: "vn-logistics@decathlon.com", phone: "+84 28 3622 5500", industry: "Sports", status: "active", tier: "REGULAR", isApproved: true, taxCode: "0310901234", address: "Aeon Mall, Tan Phu, HCMC" },
        { name: "Hoa Sen Steel Group", email: "export@hoasen.com.vn", phone: "+84 28 7300 8000", industry: "Steel", status: "active", tier: "POTENTIAL", isApproved: false, taxCode: "0311012345", address: "9 Doan Van Bo, D4, HCMC" },
        { name: "Vinamilk Export Div.", email: "export@vinamilk.com.vn", phone: "+84 28 5416 7799", industry: "Food & Beverage", status: "active", tier: "POTENTIAL", isApproved: true, taxCode: "0312123456", address: "10 Tan Trao, D7, HCMC" },
    ];

    const createdCustomers = [];
    for (const c of customersData) {
        const cust = await prisma.customer.upsert({
            where: { email: c.email },
            update: {},
            create: { ...c, userId: [sale1, sale2, sale3, admin, sale1, sale2, sale3, sale1, sale2, sale3, sale1, sale2, sale3, sale1, sale2][createdCustomers.length].id }
        });
        createdCustomers.push(cust);
    }

    console.log("Customers created.");

    const flightsData = [
        { airline: "Vietnam Airlines", flightNo: "VN601", origin: "SGN", destination: "NRT", departure: "00:05", arrival: "08:00", capacity: 20000, status: "on_time", type: "Cargo" },
        { airline: "Vietnam Airlines", flightNo: "VN741", origin: "SGN", destination: "CDG", departure: "23:45", arrival: "06:30", capacity: 15000, status: "on_time", type: "Cargo" },
        { airline: "Cathay Pacific Cargo", flightNo: "CX7003", origin: "SGN", destination: "HKG", departure: "10:30", arrival: "14:00", capacity: 25000, status: "on_time", type: "Cargo" },
        { airline: "Korean Air Cargo", flightNo: "KE6771", origin: "ICN", destination: "SGN", departure: "13:00", arrival: "18:30", capacity: 30000, status: "on_time", type: "Cargo" },
        { airline: "Lufthansa Cargo", flightNo: "LH8439", origin: "SGN", destination: "FRA", departure: "22:00", arrival: "05:45", capacity: 18000, status: "on_time", type: "Cargo" },
        { airline: "Singapore Airlines", flightNo: "SQ8455", origin: "SGN", destination: "SIN", departure: "08:00", arrival: "11:10", capacity: 12000, status: "on_time", type: "Cargo" },
        { airline: "Emirates SkyCargo", flightNo: "EK9631", origin: "SGN", destination: "DXB", departure: "03:00", arrival: "06:45", capacity: 22000, status: "delayed", type: "Cargo" },
        { airline: "FedEx Express", flightNo: "FX5821", origin: "SGN", destination: "LAX", departure: "05:00", arrival: "13:00", capacity: 35000, status: "on_time", type: "Express" },
        { airline: "DHL Aviation", flightNo: "DH9452", origin: "HAN", destination: "SIN", departure: "18:00", arrival: "21:10", capacity: 10000, status: "on_time", type: "Express" },
        { airline: "China Airlines Cargo", flightNo: "CI7801", origin: "HAN", destination: "TPE", departure: "09:00", arrival: "13:30", capacity: 20000, status: "on_time", type: "Cargo" },
    ];

    const createdFlights = [];
    for (const f of flightsData) {
        const fl = await prisma.flight.upsert({ where: { flightNo: f.flightNo }, update: {}, create: f });
        createdFlights.push(fl);
    }

    console.log("Flights created.");

    // Booking data - all amounts in VND (millions scale)
    const salesUsers = [sale1, sale2, sale3, admin, sale1, sale2, sale3, sale1, sale2, sale3];
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

    const bookingsData = [
        // APPROVED + delivered - high value
        { ref: "BKG-2025-001", awb: "160-10000001", cIdx: 0, fIdx: 0, sIdx: 0, origin: "SGN", dest: "NRT", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 120, weight: 4800, chargeable: 5200, freight: 41600000, surcharge: 5200000, other: 1040000, total: 47840000, cost: 32000000, commission: 1435200, shipper: "Samsung Vina Co. Ltd", cargo: "Consumer Electronics", daysAgo: 45 },
        { ref: "BKG-2025-002", awb: "160-10000002", cIdx: 1, fIdx: 4, sIdx: 1, origin: "SGN", dest: "FRA", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 80, weight: 2400, chargeable: 2600, freight: 28600000, surcharge: 3900000, other: 780000, total: 33280000, cost: 22800000, commission: 998400, shipper: "Nike Vietnam Manufacturing", cargo: "Footwear & Apparel", daysAgo: 40 },
        { ref: "BKG-2025-003", awb: "160-10000003", cIdx: 2, fIdx: 2, sIdx: 2, origin: "SGN", dest: "HKG", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 60, weight: 900, chargeable: 1100, freight: 13200000, surcharge: 1800000, other: 360000, total: 15360000, cost: 10200000, commission: 460800, shipper: "Apple Supply Chain VN", cargo: "Mobile Components", daysAgo: 38 },
        { ref: "BKG-2025-004", awb: "160-10000004", cIdx: 3, fIdx: 3, sIdx: 0, origin: "HAN", dest: "ICN", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 200, weight: 8000, chargeable: 8500, freight: 68000000, surcharge: 8500000, other: 1700000, total: 78200000, cost: 52000000, commission: 2346000, shipper: "LG Electronics Haiphong", cargo: "Display Panels", daysAgo: 35 },
        { ref: "BKG-2025-005", awb: "160-10000005", cIdx: 4, fIdx: 7, sIdx: 3, origin: "SGN", dest: "LAX", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 150, weight: 3600, chargeable: 4000, freight: 60000000, surcharge: 7500000, other: 1500000, total: 69000000, cost: 48000000, commission: 2070000, shipper: "Foxconn Industrial Vietnam", cargo: "PCB Assembly", daysAgo: 32 },
        { ref: "BKG-2025-006", awb: "160-10000006", cIdx: 5, fIdx: 4, sIdx: 1, origin: "SGN", dest: "FRA", status: "delivered", approval: "APPROVED", payment: "PARTIAL", pieces: 95, weight: 2850, chargeable: 3000, freight: 33000000, surcharge: 4200000, other: 840000, total: 38040000, cost: 25000000, commission: 1141200, shipper: "H&M Sourcing Vietnam", cargo: "Fashion Apparel", daysAgo: 30 },
        { ref: "BKG-2025-007", awb: "160-10000007", cIdx: 6, fIdx: 5, sIdx: 2, origin: "SGN", dest: "SIN", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 40, weight: 800, chargeable: 900, freight: 7200000, surcharge: 1080000, other: 220000, total: 8500000, cost: 5800000, commission: 255000, shipper: "BASF Vietnam Ltd", cargo: "Chemical Samples", daysAgo: 28 },
        { ref: "BKG-2025-008", awb: "160-10000008", cIdx: 7, fIdx: 9, sIdx: 0, origin: "HAN", dest: "TPE", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 110, weight: 3300, chargeable: 3500, freight: 31500000, surcharge: 4000000, other: 800000, total: 36300000, cost: 24000000, commission: 1089000, shipper: "Adidas Sourcing HAN", cargo: "Sports Footwear", daysAgo: 25 },
        { ref: "BKG-2025-009", awb: "160-10000009", cIdx: 8, fIdx: 0, sIdx: 1, origin: "SGN", dest: "NRT", status: "in_transit", approval: "APPROVED", payment: "UNPAID", pieces: 75, weight: 2250, chargeable: 2500, freight: 20000000, surcharge: 2800000, other: 560000, total: 23360000, cost: 15800000, commission: 700800, shipper: "Panasonic Vietnam", cargo: "Air Conditioner Parts", daysAgo: 10 },
        { ref: "BKG-2025-010", awb: "160-10000010", cIdx: 9, fIdx: 8, sIdx: 2, origin: "HAN", dest: "SIN", status: "departed", approval: "APPROVED", payment: "UNPAID", pieces: 55, weight: 1650, chargeable: 1800, freight: 14400000, surcharge: 2000000, other: 400000, total: 16800000, cost: 11200000, commission: 504000, shipper: "Brother Industries VN", cargo: "Printer Components", daysAgo: 8 },
        { ref: "BKG-2025-011", awb: "160-10000011", cIdx: 10, fIdx: 1, sIdx: 0, origin: "SGN", dest: "CDG", status: "departed", approval: "APPROVED", payment: "UNPAID", pieces: 180, weight: 5400, chargeable: 5800, freight: 69600000, surcharge: 8700000, other: 1740000, total: 80040000, cost: 55000000, commission: 2401200, shipper: "Zara Inditex Sourcing", cargo: "Fast Fashion Collection", daysAgo: 6 },
        { ref: "BKG-2025-012", awb: "160-10000012", cIdx: 11, fIdx: 5, sIdx: 1, origin: "SGN", dest: "SIN", status: "pending", approval: "APPROVED", payment: "UNPAID", pieces: 30, weight: 450, chargeable: 500, freight: 4000000, surcharge: 600000, other: 120000, total: 4720000, cost: 3200000, commission: 141600, shipper: "Unilever Vietnam", cargo: "Personal Care Products", daysAgo: 4 },
        { ref: "BKG-2025-013", awb: "160-10000013", cIdx: 0, fIdx: 6, sIdx: 2, origin: "SGN", dest: "DXB", status: "pending", approval: "APPROVED", payment: "UNPAID", pieces: 90, weight: 2700, chargeable: 3000, freight: 27000000, surcharge: 3500000, other: 700000, total: 31200000, cost: 21000000, commission: 936000, shipper: "Samsung Vina Co. Ltd", cargo: "Home Appliances", daysAgo: 3 },
        { ref: "BKG-2025-014", awb: "160-10000014", cIdx: 1, fIdx: 4, sIdx: 0, origin: "SGN", dest: "FRA", status: "pending", approval: "PENDING", payment: "UNPAID", pieces: 65, weight: 1950, chargeable: 2100, freight: 23100000, surcharge: 3000000, other: 600000, total: 26700000, cost: 18000000, commission: 801000, shipper: "Nike Vietnam Manufacturing", cargo: "Athletic Footwear", daysAgo: 2 },
        { ref: "BKG-2025-015", awb: "160-10000015", cIdx: 3, fIdx: 3, sIdx: 1, origin: "HAN", dest: "ICN", status: "pending", approval: "PENDING", payment: "UNPAID", pieces: 140, weight: 5600, chargeable: 6000, freight: 48000000, surcharge: 6000000, other: 1200000, total: 55200000, cost: 38000000, commission: 1656000, shipper: "LG Electronics Haiphong", cargo: "OLED TV Panels", daysAgo: 1 },
        { ref: "BKG-2025-016", awb: "160-10000016", cIdx: 2, fIdx: 7, sIdx: 2, origin: "SGN", dest: "LAX", status: "pending", approval: "PENDING", payment: "UNPAID", pieces: 100, weight: 2000, chargeable: 2200, freight: 33000000, surcharge: 4200000, other: 840000, total: 38040000, cost: 26000000, commission: 1141200, shipper: "Apple Supply Chain VN", cargo: "iPhone Components", daysAgo: 1 },
        { ref: "BKG-2025-017", awb: "160-10000017", cIdx: 12, fIdx: 2, sIdx: 0, origin: "SGN", dest: "HKG", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 25, weight: 375, chargeable: 400, freight: 4800000, surcharge: 650000, other: 130000, total: 5580000, cost: 3800000, commission: 167400, shipper: "Decathlon Vietnam", cargo: "Sporting Goods", daysAgo: 20 },
        { ref: "BKG-2025-018", awb: "160-10000018", cIdx: 4, fIdx: 7, sIdx: 3, origin: "SGN", dest: "LAX", status: "delivered", approval: "APPROVED", payment: "PAID", pieces: 88, weight: 2640, chargeable: 2900, freight: 43500000, surcharge: 5500000, other: 1100000, total: 50100000, cost: 34000000, commission: 1503000, shipper: "Foxconn Industrial Vietnam", cargo: "Server Components", daysAgo: 18 },
        { ref: "BKG-2025-019", awb: "160-10000019", cIdx: 5, fIdx: 1, sIdx: 1, origin: "SGN", dest: "CDG", status: "delivered", approval: "APPROVED", payment: "PARTIAL", pieces: 72, weight: 2160, chargeable: 2300, freight: 25300000, surcharge: 3200000, other: 640000, total: 29140000, cost: 19500000, commission: 874200, shipper: "H&M Sourcing Vietnam", cargo: "Spring Collection", daysAgo: 15 },
        { ref: "BKG-2025-020", awb: "160-10000020", cIdx: 7, fIdx: 9, sIdx: 0, origin: "HAN", dest: "TPE", status: "in_transit", approval: "APPROVED", payment: "UNPAID", pieces: 130, weight: 3900, chargeable: 4200, freight: 37800000, surcharge: 4800000, other: 960000, total: 43560000, cost: 29500000, commission: 1306800, shipper: "Adidas Sourcing HAN", cargo: "Training Wear", daysAgo: 5 },
    ];

    const createdBookings = [];
    for (const b of bookingsData) {
        const createdAt = daysAgo(b.daysAgo);
        const booking = await prisma.booking.upsert({
            where: { reference: b.ref },
            update: {},
            create: {
                reference: b.ref,
                awbNumber: b.awb,
                customerId: createdCustomers[b.cIdx].id,
                salesId: salesUsers[b.sIdx].id,
                flightId: createdFlights[b.fIdx].id,
                origin: b.origin,
                destination: b.dest,
                status: b.status,
                approvalStatus: b.approval,
                paymentStatus: b.payment,
                pieces: b.pieces,
                weight: b.weight,
                chargeableWeight: b.chargeable,
                freightRevenue: b.freight,
                surcharge: b.surcharge,
                otherFees: b.other,
                totalRevenue: b.total,
                totalCost: b.cost,
                commission: b.commission,
                shipper: b.shipper,
                cargoType: b.cargo,
                service: b.fIdx >= 7 ? "Express" : "Standard",
                createdAt,
                updatedAt: createdAt,
            }
        });
        createdBookings.push(booking);
    }

    console.log("Bookings created.");

    for (const b of createdBookings) {
        const booking = bookingsData.find(bd => bd.ref === b.reference);
        if (!booking) continue;
        const dueDate = new Date(b.createdAt.getTime() + 30 * 86400000);
        const isPaid = booking.payment === "PAID";
        const isPartial = booking.payment === "PARTIAL";
        await prisma.invoice.upsert({
            where: { invoiceNo: `INV-${b.reference}` },
            update: {},
            create: {
                invoiceNo: `INV-${b.reference}`,
                bookingId: b.id,
                amount: b.totalRevenue,
                currency: "VND",
                status: isPaid ? "paid" : isPartial ? "partial" : "unpaid",
                dueDate,
                paidDate: isPaid ? new Date(b.createdAt.getTime() + 15 * 86400000) : null,
            }
        });
    }

    console.log("Invoices created.");

    // App settings
    await prisma.appSetting.upsert({
        where: { id: "global" },
        update: {},
        create: {
            id: "global",
            systemName: "LOGICTIS AIR",
            companyName: "Logictis Air Freight JSC",
            companyAddress: "15 Le Thanh Ton, Ben Nghe Ward, District 1, Ho Chi Minh City",
            companyPhone: "+84 28 3823 9900",
            companyEmail: "ops@logictis.com",
            companyTaxCode: "0300123456",
            companyBankInfo: "Vietcombank - Acc: 0071000123456 - HCMC Branch",
            companyCountry: "Vietnam",
            companyState: "Ho Chi Minh City",
            companyCity: "Ho Chi Minh City",
        }
    });

    console.log("App settings created.");
    console.log("\nSeed completed successfully!");
    console.log("-----------------------------------");
    console.log("Login credentials:");
    console.log("  Admin:       admin@logictis.com / admin123");
    console.log("  Sale (Lan):  sale@logictis.com  / sale123");
    console.log("  Sale (Tuan): sale2@logictis.com / sale456");
    console.log("  Sale (Hung): sale3@logictis.com / sale789");
    console.log("  Accounting:  accounting@logictis.com / acc123");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
