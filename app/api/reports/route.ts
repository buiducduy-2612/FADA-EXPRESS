import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Filtering
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const salesId = searchParams.get("salesId");
        const customerId = searchParams.get("customerId");
        const airline = searchParams.get("airline");

        const where: any = {};
        
        const userRole = (session.user as any)?.role;
        const userId = (session.user as any)?.id;

        // SALE role: strictly limit to their own bookings only
        if (userRole === "SALE") {
            where.salesId = userId;
        } else if (salesId) {
            // ADMIN/DIRECTOR/CS can optionally filter to a specific sales employee
            where.salesId = salesId;
        }
        // No salesId filter = ADMIN/DIRECTOR sees ALL bookings

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (customerId) where.customerId = customerId;
        if (airline) {
            where.flight = { airline: airline };
        }

        const [bookings, invoices, _customers, _users, _flights] = await Promise.all([
            (prisma as any).booking.findMany({ 
                where, 
                include: { customer: true, sales: true, flight: true, invoices: true } 
            }),
            (prisma as any).invoice.findMany({ 
                where: {
                    booking: where
                },
                include: { booking: { include: { customer: true } } } 
            }),
            (prisma as any).customer.findMany({ 
                where: {
                    ...(startDate && endDate ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } } : {}),
                    ...(userRole === 'SALE' ? { OR: [{ userId: userId }, { personInChargeId: userId }] } : {}),
                    ...(customerId ? { id: customerId } : {})
                },
                include: { sales: true }
            }),
            (prisma as any).user.findMany({ 
                where: { 
                    role: { in: ['SALE', 'ADMIN', 'DIRECTOR'] },
                    ...(userRole === 'SALE' ? { id: userId } : {})
                } 
            }),
            (prisma as any).flight.findMany()
        ]);

        const shipments = bookings;
        const quotes = bookings; // Since quotes are merged into bookings

        // 1. Monthly Revenue Report
        const monthlyReportMap = new Map();
        (shipments as any[]).forEach(s => {
            const date = s.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyReportMap.has(date)) {
                monthlyReportMap.set(date, { month: date, shipments: 0, freight: 0, surcharge: 0, revenue: 0, cost: 0, profit: 0 });
            }
            const data = monthlyReportMap.get(date);
            
            // Only count approved/accepted for financial stats
            if (s.status === "accepted" || s.approvalStatus === "APPROVED") {
                data.shipments++;
                data.freight += s.freightRevenue || 0;
                data.surcharge += s.surcharge || 0;
                data.revenue += s.totalRevenue || 0;
                data.cost += s.totalCost || 0;
                data.profit += (s.totalRevenue || 0) - (s.totalCost || 0);
            }
        });

        // 2. Sales Report (Expanded with conversion)
        const salesReportMap = new Map();
        (shipments as any[]).forEach(s => {
            const saleName = s.sales?.name || "Unassigned";
            if (!salesReportMap.has(saleName)) {
                salesReportMap.set(saleName, { name: saleName, shipments: 0, revenue: 0, cost: 0, profit: 0, accepted: 0, total: 0, customers: new Set() });
            }
            const data = salesReportMap.get(saleName);
            data.total++;
            if (s.status === "accepted" || s.approvalStatus === "APPROVED") {
                data.accepted++;
                data.shipments++;
                data.revenue += s.totalRevenue || 0;
                data.cost += s.totalCost || 0;
                data.profit += (s.totalRevenue || 0) - (s.totalCost || 0);
                data.customers.add(s.customerId);
            }
        });
        const salesReport = Array.from(salesReportMap.values()).map((d: any) => ({
            ...d,
            customers: d.customers.size,
            avgPerShipment: d.shipments > 0 ? d.revenue / d.shipments : 0,
            conversionRate: d.total > 0 ? (d.accepted / d.total) * 100 : 0
        }));

        // 3. Customer Report — with full P&L
        const customerReportMap = new Map();
        (shipments as any[]).forEach(s => {
            const custName = s.customer?.name || "Unknown";
            const custId   = s.customer?.id   || "unknown";
            if (!customerReportMap.has(custId)) {
                customerReportMap.set(custId, { name: custName, shipments: 0, revenue: 0, cost: 0, profit: 0, commission: 0 });
            }
            const data = customerReportMap.get(custId);
            
            if (s.status === "accepted" || s.approvalStatus === "APPROVED") {
                data.shipments++;
                data.revenue    += s.totalRevenue || 0;
                data.cost       += s.totalCost    || 0;
                data.profit     += (s.totalRevenue || 0) - (s.totalCost || 0);
                data.commission += s.commission   || 0;
            }
        });
        const customerReport = Array.from(customerReportMap.values()).map((d: any) => ({
            ...d,
            avgShipmentValue: d.shipments > 0 ? d.revenue / d.shipments : 0,
            margin: d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : "0",
        }));

        // 4. Route Report
        const routeReportMap = new Map();
        (shipments as any[]).forEach(s => {
            const route = `${s.origin}-${s.destination}`;
            if (!routeReportMap.has(route)) {
                routeReportMap.set(route, { origin: s.origin, dest: s.destination, shipments: 0, weight: 0, revenue: 0 });
            }
            const data = routeReportMap.get(route);
            
            if (s.status === "accepted" || s.approvalStatus === "APPROVED") {
                data.shipments++;
                data.weight += s.weight || 0;
                data.revenue += s.totalRevenue || 0;
            }
        });

        // 5. Airline Report
        const airlineReportMap = new Map();
        (shipments as any[]).forEach(s => {
            const airlineName = s.flight?.airline || "Other";
            if (!airlineReportMap.has(airlineName)) {
                airlineReportMap.set(airlineName, { airline: airlineName, shipments: 0, weight: 0, revenue: 0 });
            }
            const data = airlineReportMap.get(airlineName);
            
            if (s.status === "accepted" || s.approvalStatus === "APPROVED") {
                data.shipments++;
                data.weight += s.weight || 0;
                data.revenue += s.totalRevenue || 0;
            }
        });

        // 6. Shipment Status Report
        const statusReportMap: any = { booking_received: 0, in_transit: 0, delivered: 0, delayed: 0, cancelled: 0, other: 0 };
        (shipments as any[]).forEach(s => {
            const st = s.status;
            if (statusReportMap.hasOwnProperty(st)) statusReportMap[st]++;
            else statusReportMap.other++;
        });

        // 7. Debt Report (A/R)
        const debtReportMap = new Map();
        (invoices as any[]).forEach(inv => {
            const custId = inv.booking?.customerId || "unknown";
            const custName = inv.booking?.customer?.name || "Unknown";
            if (!debtReportMap.has(custId)) {
                debtReportMap.set(custId, { name: custName, total: 0, paid: 0, unpaid: 0, overdue: 0 });
            }
            const data = debtReportMap.get(custId);
            data.total += inv.amount;
            if (inv.status === "paid") data.paid += inv.amount;
            else if (inv.status === "overdue") {
                data.overdue += inv.amount;
                data.unpaid += inv.amount;
            } else {
                data.unpaid += inv.amount;
            }
        });

        // 8. Quote Conversion (Global)
        const totalQuotes = (quotes as any[]).length;
        const acceptedQuotes = (quotes as any[]).filter(q => q.status === "accepted" || q.approvalStatus === "APPROVED").length;
        const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

        // 9. Personal Performance (for ANY user who has bookings)
        const myBookings = shipments.filter((s: any) => s.salesId === (session.user as any).id);
        const myApprovedBookings = myBookings.filter((s: any) => s.approvalStatus === "APPROVED" || s.status === "accepted");
        
        let personalStats = null;
        if (myBookings.length > 0 || userRole === "SALE") {
            const myCustomers = await (prisma as any).customer.findMany({ where: { personInChargeId: (session.user as any).id } });
            personalStats = {
                customers: {
                    total: myCustomers.length,
                    approved: myCustomers.filter((c: any) => c.isApproved).length,
                    pending: myCustomers.filter((c: any) => !c.isApproved).length
                },
                revenue: myApprovedBookings.reduce((acc: number, b: any) => acc + (b.totalRevenue || 0), 0),
                commission: myApprovedBookings.reduce((acc: number, b: any) => acc + (b.commission || 0), 0),
                shipments: myApprovedBookings.length
            };
        }

        // 10. Customer Acquisition Report (New Customers per Employee)
        const customerAcquisitionMap = new Map();
        (_customers as any[]).forEach(c => {
            const date = c.createdAt.toISOString().substring(0, 10);
            const employeeName = c.sales?.name || "Unassigned";
            
            if (!customerAcquisitionMap.has(date)) {
                customerAcquisitionMap.set(date, { date, total: 0, byEmployee: {} });
            }
            const dateData = customerAcquisitionMap.get(date);
            dateData.total++;
            dateData.byEmployee[employeeName] = (dateData.byEmployee[employeeName] || 0) + 1;
        });

        // 11. Detailed Commission Report with Grand Totals
        const reportShipments = (shipments as any[]).filter(s => s.approvalStatus === "APPROVED" || s.status === "accepted");
        const commissionDetails = reportShipments.map(s => ({
            id: s.id,
            reference: s.reference,
            customer: s.customer?.name,
            sales: s.sales?.name,
            date: s.createdAt,
            revenue: s.totalRevenue || 0,
            cost: s.totalCost || 0,
            profit: (s.totalRevenue || 0) - (s.totalCost || 0),
            commission: s.commission || 0
        }));

        const grandTotals = {
            revenue: reportShipments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
            cost: reportShipments.reduce((sum, s) => sum + (s.totalCost || 0), 0),
            profit: reportShipments.reduce((sum, s) => sum + ((s.totalRevenue || 0) - (s.totalCost || 0)), 0),
            commission: reportShipments.reduce((sum, s) => sum + (s.commission || 0), 0)
        };

        return NextResponse.json({
            monthly: Array.from(monthlyReportMap.values()).sort((a, b) => b.month.localeCompare(a.month)),
            sales: salesReport,
            customers: customerReport,
            personal: personalStats,
            acquisition: Array.from(customerAcquisitionMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
            commissions: commissionDetails,
            tiers: Object.values(shipments.reduce((acc: any, s: any) => {
                const tier = s.customer?.tier || "POTENTIAL";
                if (!acc[tier]) acc[tier] = { tier, revenue: 0, profit: 0, count: 0 };
                if (s.approvalStatus === "APPROVED" || s.status === "accepted") {
                    acc[tier].revenue += s.totalRevenue || 0;
                    acc[tier].profit += (s.totalRevenue || 0) - (s.totalCost || 0);
                    acc[tier].count++;
                }
                return acc;
            }, {})),
            grandTotals
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to build reports" }, { status: 500 });
    }
}
