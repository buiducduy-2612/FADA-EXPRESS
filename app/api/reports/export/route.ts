import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

const BRAND_ORANGE = "FFEA580A";  // #EA580A with full alpha
const BRAND_DARK   = "FF1A1A2E";
const HEADER_BG    = "FF0F172A";
const HEADER_FG    = "FFFFFFFF";
const SUBHEADER_BG = "FFEA580A";
const SUBHEADER_FG = "FFFFFFFF";
const ROW_ALT      = "FFFFF7ED";
const POSITIVE     = "FF065F46";
const NEGATIVE     = "FF991B1B";
const BORDER_COLOR = "FFE2E8F0";

function fmtNum(n: number) { return Math.round(n); }

function applyHeaderStyle(cell: ExcelJS.Cell, bg = HEADER_BG, fg = HEADER_FG) {
    cell.font = { bold: true, color: { argb: fg }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
    };
}

function applyDataStyle(cell: ExcelJS.Cell, altRow = false, align: "left" | "center" | "right" = "left") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: altRow ? ROW_ALT : "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: align, wrapText: false };
    cell.border = {
        top: { style: "hair", color: { argb: BORDER_COLOR } },
        left: { style: "hair", color: { argb: BORDER_COLOR } },
        bottom: { style: "hair", color: { argb: BORDER_COLOR } },
        right: { style: "hair", color: { argb: BORDER_COLOR } },
    };
    cell.font = { size: 10 };
}

function applyTotalStyle(cell: ExcelJS.Cell) {
    cell.font = { bold: true, size: 11, color: { argb: HEADER_FG } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ORANGE } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
    cell.border = {
        top: { style: "medium", color: { argb: BRAND_ORANGE } },
        bottom: { style: "medium", color: { argb: BRAND_ORANGE } },
    };
}

function addSheetTitle(sheet: ExcelJS.Worksheet, title: string, cols: number) {
    const titleRow = sheet.addRow([title]);
    sheet.mergeCells(`A${titleRow.number}:${String.fromCharCode(64 + cols)}${titleRow.number}`);
    const titleCell = sheet.getCell(`A${titleRow.number}`);
    titleCell.font = { bold: true, size: 14, color: { argb: HEADER_FG } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 32;

    const subRow = sheet.addRow([`FADA EXPRESS — Báo cáo xuất ngày ${new Date().toLocaleDateString("vi-VN")}`]);
    sheet.mergeCells(`A${subRow.number}:${String.fromCharCode(64 + cols)}${subRow.number}`);
    const subCell = sheet.getCell(`A${subRow.number}`);
    subCell.font = { italic: true, size: 10, color: { argb: BRAND_ORANGE } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    subRow.height = 22;

    sheet.addRow([]);
}

function numFmt(sheet: ExcelJS.Worksheet, col: string, startRow: number, endRow: number) {
    for (let r = startRow; r <= endRow; r++) {
        const cell = sheet.getCell(`${col}${r}`);
        cell.numFmt = '#,##0';
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const startDate = searchParams.get("startDate");
        const endDate   = searchParams.get("endDate");
        const salesId   = searchParams.get("salesId");
        const type      = searchParams.get("type") || "full"; // full | bookings

        const userRole = (session.user as any)?.role;
        const userId   = (session.user as any)?.id;

        const where: any = {};
        if (userRole === "SALE") {
            where.salesId = userId;
        } else if (salesId) {
            where.salesId = salesId;
        }
        if (startDate && endDate) {
            where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59") };
        }

        const bookings = await (prisma as any).booking.findMany({
            where,
            include: { customer: true, sales: true, flight: true, invoices: true },
            orderBy: { createdAt: "desc" }
        });

        const approved = bookings.filter((b: any) => b.approvalStatus === "APPROVED" || b.status === "accepted");

        const wb = new ExcelJS.Workbook();
        wb.creator = "FADA EXPRESS CRM";
        wb.lastModifiedBy = (session.user as any)?.name || "System";
        wb.created = new Date();
        wb.modified = new Date();

        const periodLabel = startDate && endDate ? `${startDate} → ${endDate}` : "Toàn bộ";

        // ─────────────────────────────────────────────
        // SHEET 1: Tổng quan / Summary
        // ─────────────────────────────────────────────
        const ws1 = wb.addWorksheet("📊 Tổng Quan", { properties: { tabColor: { argb: "FFEA580A" } } });
        ws1.columns = [
            { width: 35 }, { width: 25 }, { width: 25 }, { width: 25 }
        ];
        addSheetTitle(ws1, `📊 TỔNG QUAN KINH DOANH — ${periodLabel}`, 4);

        const summaryHeaders = ["Chỉ tiêu", "Giá trị", "Đơn vị", "Ghi chú"];
        const sh = ws1.addRow(summaryHeaders);
        sh.height = 28;
        sh.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        const totalRevenue  = approved.reduce((s: number, b: any) => s + (b.totalRevenue || 0), 0);
        const totalCost     = approved.reduce((s: number, b: any) => s + (b.totalCost || 0), 0);
        const totalProfit   = totalRevenue - totalCost;
        const totalCommission = approved.reduce((s: number, b: any) => s + (b.commission || 0), 0);
        const totalWeight   = approved.reduce((s: number, b: any) => s + (b.weight || 0), 0);
        const margin        = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

        const summaryRows = [
            ["Tổng số đơn hàng", bookings.length, "Đơn", "Tất cả trạng thái"],
            ["Đơn hàng đã duyệt", approved.length, "Đơn", "Có tính doanh thu"],
            ["Tổng Doanh thu", fmtNum(totalRevenue), "VNĐ", "Chỉ đơn đã duyệt"],
            ["Tổng Chi phí", fmtNum(totalCost), "VNĐ", "Giá vốn đầu vào"],
            ["Tổng Lợi nhuận gộp", fmtNum(totalProfit), "VNĐ", `Biên LN: ${margin}%`],
            ["Tổng Hoa hồng", fmtNum(totalCommission), "VNĐ", "Commission Sales"],
            ["Tổng Trọng lượng", fmtNum(totalWeight), "KG", "Đơn đã duyệt"],
            ["Biên lợi nhuận", `${margin}%`, "%", "Profit Margin"],
        ];

        summaryRows.forEach((row, i) => {
            const r = ws1.addRow(row);
            r.height = 24;
            r.eachCell((c, ci) => {
                applyDataStyle(c, i % 2 === 0, ci === 2 ? "right" : "left");
            });
            if (i >= 2 && i <= 6) {
                const profitCell = r.getCell(2);
                if (row[0] === "Tổng Lợi nhuận gộp") {
                    profitCell.font = { bold: true, color: { argb: totalProfit >= 0 ? "FF065F46" : "FF991B1B" }, size: 11 };
                }
            }
        });

        // ─────────────────────────────────────────────
        // SHEET 2: Doanh thu theo Tháng
        // ─────────────────────────────────────────────
        const ws2 = wb.addWorksheet("📅 Theo Tháng", { properties: { tabColor: { argb: "FF0EA5E9" } } });
        ws2.columns = [
            { width: 15 }, { width: 12 }, { width: 20 }, { width: 20 },
            { width: 20 }, { width: 18 }, { width: 15 }
        ];
        addSheetTitle(ws2, `📅 DOANH THU & LỢI NHUẬN THEO THÁNG — ${periodLabel}`, 7);

        const mh = ws2.addRow(["Tháng", "Số đơn", "Doanh thu (VNĐ)", "Chi phí (VNĐ)", "Lợi nhuận (VNĐ)", "Hoa hồng (VNĐ)", "Biên LN %"]);
        mh.height = 28;
        mh.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        const monthlyMap = new Map<string, any>();
        approved.forEach((b: any) => {
            const m = b.createdAt.toISOString().substring(0, 7);
            if (!monthlyMap.has(m)) monthlyMap.set(m, { month: m, count: 0, revenue: 0, cost: 0, profit: 0, commission: 0 });
            const d = monthlyMap.get(m);
            d.count++;
            d.revenue    += b.totalRevenue || 0;
            d.cost       += b.totalCost    || 0;
            d.profit     += (b.totalRevenue || 0) - (b.totalCost || 0);
            d.commission += b.commission   || 0;
        });

        const monthlyRows = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));
        monthlyRows.forEach((m, i) => {
            const margin2 = m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : "0";
            const r = ws2.addRow([m.month, m.count, fmtNum(m.revenue), fmtNum(m.cost), fmtNum(m.profit), fmtNum(m.commission), `${margin2}%`]);
            r.height = 22;
            r.eachCell((c, ci) => {
                applyDataStyle(c, i % 2 === 0, ci > 1 ? "right" : "left");
                if (ci === 5) c.font = { bold: true, color: { argb: m.profit >= 0 ? POSITIVE : NEGATIVE }, size: 10 };
            });
        });

        // Total row
        const mTot = ws2.addRow(["TỔNG", monthlyRows.reduce((s, m) => s + m.count, 0),
            fmtNum(monthlyRows.reduce((s, m) => s + m.revenue, 0)),
            fmtNum(monthlyRows.reduce((s, m) => s + m.cost, 0)),
            fmtNum(monthlyRows.reduce((s, m) => s + m.profit, 0)),
            fmtNum(monthlyRows.reduce((s, m) => s + m.commission, 0)), ""]);
        mTot.height = 26;
        mTot.eachCell(c => applyTotalStyle(c));

        // ─────────────────────────────────────────────
        // SHEET 3: Lãi lỗ theo Khách hàng
        // ─────────────────────────────────────────────
        const ws3 = wb.addWorksheet("👥 Lãi Lỗ Khách Hàng", { properties: { tabColor: { argb: "FF10B981" } } });
        ws3.columns = [
            { width: 5 }, { width: 30 }, { width: 12 }, { width: 22 }, { width: 22 },
            { width: 22 }, { width: 22 }, { width: 15 }
        ];
        addSheetTitle(ws3, `👥 LÃI LỖ THEO KHÁCH HÀNG — ${periodLabel}`, 8);

        const ch = ws3.addRow(["#", "Tên khách hàng", "Số đơn", "Doanh thu (VNĐ)", "Chi phí (VNĐ)", "Lợi nhuận (VNĐ)", "TB/Đơn (VNĐ)", "Biên LN %"]);
        ch.height = 28;
        ch.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        const custMap = new Map<string, any>();
        approved.forEach((b: any) => {
            const key = b.customer?.name || "Chưa xác định";
            if (!custMap.has(key)) custMap.set(key, { name: key, count: 0, revenue: 0, cost: 0, profit: 0 });
            const d = custMap.get(key);
            d.count++;
            d.revenue += b.totalRevenue || 0;
            d.cost    += b.totalCost    || 0;
            d.profit  += (b.totalRevenue || 0) - (b.totalCost || 0);
        });

        const custRows = Array.from(custMap.values()).sort((a, b) => b.revenue - a.revenue);
        custRows.forEach((c, i) => {
            const margin3 = c.revenue > 0 ? ((c.profit / c.revenue) * 100).toFixed(1) : "0";
            const avg     = c.count > 0 ? c.revenue / c.count : 0;
            const r = ws3.addRow([i + 1, c.name, c.count, fmtNum(c.revenue), fmtNum(c.cost), fmtNum(c.profit), fmtNum(avg), `${margin3}%`]);
            r.height = 22;
            r.eachCell((cell, ci) => {
                applyDataStyle(cell, i % 2 === 0, ci > 2 ? "right" : ci === 1 ? "center" : "left");
                if (ci === 6) cell.font = { bold: true, color: { argb: c.profit >= 0 ? POSITIVE : NEGATIVE }, size: 10 };
            });
        });

        const cTot = ws3.addRow(["", "TỔNG CỘNG",
            custRows.reduce((s, c) => s + c.count, 0),
            fmtNum(custRows.reduce((s, c) => s + c.revenue, 0)),
            fmtNum(custRows.reduce((s, c) => s + c.cost, 0)),
            fmtNum(custRows.reduce((s, c) => s + c.profit, 0)), "", ""]);
        cTot.height = 26;
        cTot.eachCell(c => applyTotalStyle(c));

        // ─────────────────────────────────────────────
        // SHEET 4: Lãi lỗ theo Nhân viên
        // ─────────────────────────────────────────────
        const ws4 = wb.addWorksheet("🧑‍💼 Lãi Lỗ Nhân Viên", { properties: { tabColor: { argb: "FF8B5CF6" } } });
        ws4.columns = [
            { width: 5 }, { width: 25 }, { width: 12 }, { width: 12 }, { width: 22 },
            { width: 22 }, { width: 22 }, { width: 22 }, { width: 15 }
        ];
        addSheetTitle(ws4, `🧑‍💼 LÃI LỖ THEO NHÂN VIÊN — ${periodLabel}`, 9);

        const sh4 = ws4.addRow(["#", "Nhân viên", "Tổng đơn", "Đã duyệt", "Doanh thu (VNĐ)", "Chi phí (VNĐ)", "Lợi nhuận (VNĐ)", "Hoa hồng (VNĐ)", "Biên LN %"]);
        sh4.height = 28;
        sh4.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        const salesMap = new Map<string, any>();
        bookings.forEach((b: any) => {
            const key = b.sales?.name || "Chưa phân công";
            if (!salesMap.has(key)) salesMap.set(key, { name: key, total: 0, approved: 0, revenue: 0, cost: 0, profit: 0, commission: 0 });
            const d = salesMap.get(key);
            d.total++;
            if (b.approvalStatus === "APPROVED" || b.status === "accepted") {
                d.approved++;
                d.revenue    += b.totalRevenue || 0;
                d.cost       += b.totalCost    || 0;
                d.profit     += (b.totalRevenue || 0) - (b.totalCost || 0);
                d.commission += b.commission   || 0;
            }
        });

        const salesRows = Array.from(salesMap.values()).sort((a, b) => b.revenue - a.revenue);
        salesRows.forEach((s, i) => {
            const margin4 = s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : "0";
            const r = ws4.addRow([i + 1, s.name, s.total, s.approved, fmtNum(s.revenue), fmtNum(s.cost), fmtNum(s.profit), fmtNum(s.commission), `${margin4}%`]);
            r.height = 22;
            r.eachCell((cell, ci) => {
                applyDataStyle(cell, i % 2 === 0, ci > 3 ? "right" : ci === 1 ? "center" : "left");
                if (ci === 7) cell.font = { bold: true, color: { argb: s.profit >= 0 ? POSITIVE : NEGATIVE }, size: 10 };
            });
        });

        const sTot = ws4.addRow(["", "TỔNG CỘNG",
            salesRows.reduce((s, r) => s + r.total, 0),
            salesRows.reduce((s, r) => s + r.approved, 0),
            fmtNum(salesRows.reduce((s, r) => s + r.revenue, 0)),
            fmtNum(salesRows.reduce((s, r) => s + r.cost, 0)),
            fmtNum(salesRows.reduce((s, r) => s + r.profit, 0)),
            fmtNum(salesRows.reduce((s, r) => s + r.commission, 0)), ""]);
        sTot.height = 26;
        sTot.eachCell(c => applyTotalStyle(c));

        // ─────────────────────────────────────────────
        // SHEET 5: Hoa hồng chi tiết
        // ─────────────────────────────────────────────
        const ws5 = wb.addWorksheet("💰 Hoa Hồng", { properties: { tabColor: { argb: "FFF59E0B" } } });
        ws5.columns = [
            { width: 12 }, { width: 20 }, { width: 28 }, { width: 22 },
            { width: 22 }, { width: 22 }, { width: 22 }, { width: 20 }
        ];
        addSheetTitle(ws5, `💰 HOA HỒNG CHI TIẾT — ${periodLabel}`, 8);

        const comH = ws5.addRow(["Ngày", "Mã đơn", "Khách hàng", "Nhân viên", "Doanh thu (VNĐ)", "Chi phí (VNĐ)", "Lợi nhuận (VNĐ)", "Hoa hồng (VNĐ)"]);
        comH.height = 28;
        comH.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        approved.forEach((b: any, i: number) => {
            const profit = (b.totalRevenue || 0) - (b.totalCost || 0);
            const r = ws5.addRow([
                b.createdAt.toLocaleDateString("vi-VN"),
                b.reference,
                b.customer?.name || "N/A",
                b.sales?.name || "N/A",
                fmtNum(b.totalRevenue || 0),
                fmtNum(b.totalCost || 0),
                fmtNum(profit),
                fmtNum(b.commission || 0)
            ]);
            r.height = 20;
            r.eachCell((cell, ci) => {
                applyDataStyle(cell, i % 2 === 0, ci > 4 ? "right" : "left");
                if (ci === 7) cell.font = { color: { argb: profit >= 0 ? POSITIVE : NEGATIVE }, size: 10 };
            });
        });

        const comTot = ws5.addRow(["", "TỔNG", "", "",
            fmtNum(approved.reduce((s: number, b: any) => s + (b.totalRevenue || 0), 0)),
            fmtNum(approved.reduce((s: number, b: any) => s + (b.totalCost    || 0), 0)),
            fmtNum(approved.reduce((s: number, b: any) => s + ((b.totalRevenue || 0) - (b.totalCost || 0)), 0)),
            fmtNum(approved.reduce((s: number, b: any) => s + (b.commission   || 0), 0))]);
        comTot.height = 26;
        comTot.eachCell(c => applyTotalStyle(c));

        // ─────────────────────────────────────────────
        // SHEET 6: Tất cả đơn hàng
        // ─────────────────────────────────────────────
        const ws6 = wb.addWorksheet("📦 Tất Cả Đơn Hàng", { properties: { tabColor: { argb: "FF64748B" } } });
        ws6.columns = [
            { width: 12 }, { width: 20 }, { width: 28 }, { width: 22 },
            { width: 15 }, { width: 15 }, { width: 12 }, { width: 12 },
            { width: 22 }, { width: 22 }, { width: 22 }, { width: 20 }, { width: 15 }
        ];
        addSheetTitle(ws6, `📦 TẤT CẢ ĐƠN HÀNG — ${periodLabel}`, 13);

        const allH = ws6.addRow([
            "Ngày tạo", "Mã đơn", "Khách hàng", "Nhân viên",
            "Xuất phát", "Điểm đến", "Số kiện", "KG",
            "Doanh thu (VNĐ)", "Chi phí (VNĐ)", "Lợi nhuận (VNĐ)", "Hoa hồng (VNĐ)",
            "Trạng thái"
        ]);
        allH.height = 28;
        allH.eachCell(c => applyHeaderStyle(c, SUBHEADER_BG));

        bookings.forEach((b: any, i: number) => {
            const profit = (b.totalRevenue || 0) - (b.totalCost || 0);
            const status = b.status === "delivered" ? "Đã giao" :
                           b.approvalStatus === "APPROVED" ? "Đã duyệt" :
                           b.approvalStatus === "PENDING" ? "Chờ duyệt" :
                           b.approvalStatus === "REJECTED" ? "Từ chối" : b.status;
            const r = ws6.addRow([
                b.createdAt.toLocaleDateString("vi-VN"),
                b.reference,
                b.customer?.name || "N/A",
                b.sales?.name || "N/A",
                b.origin,
                b.destination,
                b.pieces,
                Math.round(b.weight || 0),
                fmtNum(b.totalRevenue || 0),
                fmtNum(b.totalCost    || 0),
                fmtNum(profit),
                fmtNum(b.commission   || 0),
                status
            ]);
            r.height = 20;
            r.eachCell((cell, ci) => {
                applyDataStyle(cell, i % 2 === 0, ci > 8 ? "right" : "left");
                if (ci === 11) cell.font = { color: { argb: profit >= 0 ? POSITIVE : NEGATIVE }, size: 10 };
            });
        });

        // Auto-filter
        ws6.autoFilter = { from: "A4", to: "M4" };

        // ─────────────────────────────────────────────
        // Generate file
        // ─────────────────────────────────────────────
        const buffer = await wb.xlsx.writeBuffer();

        const safePeriod = (startDate && endDate) ? `${startDate}_${endDate}` : "all";
        const filename = `FADA_Bao_cao_${safePeriod}.xlsx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-cache",
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}
