import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function generateInvoicePdf(booking: any, settings: any = {}) {
    const doc = new jsPDF({ unit: "mm", format: "a4" }) as any;

    // Company Info from settings (with sensible defaults)
    const companyName    = settings?.companyName    || "CÔNG TY TNHH FADA LOGISTICS";
    const companyAddress = settings?.companyAddress || "TP. Hồ Chí Minh, Việt Nam";
    const companyTax     = settings?.companyTaxCode || "MST: 3703354696";
    const companyPhone   = settings?.companyPhone   || "0795.6666.72";
    const companyEmail   = settings?.companyEmail   || "atus@fadalogisticsvn.com";
    const bankInfo       = settings?.companyBankInfo || "";

    // ── Load Roboto font ─────────────────────────────────────────────
    try {
        const [regRes, boldRes] = await Promise.all([
            fetch("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf"),
            fetch("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf"),
        ]);
        if (regRes.ok && boldRes.ok) {
            const regB64  = Buffer.from(await regRes.arrayBuffer()).toString("base64");
            const boldB64 = Buffer.from(await boldRes.arrayBuffer()).toString("base64");
            doc.addFileToVFS("Roboto-Regular.ttf", regB64);
            doc.addFileToVFS("Roboto-Bold.ttf", boldB64);
            doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
            doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
        }
    } catch { /* fallback to Helvetica */ }

    const W = 210; // A4 width mm

    // ── ORANGE HEADER BAND ───────────────────────────────────────────
    doc.setFillColor(234, 88, 10);       // #EA580A brand orange
    doc.rect(0, 0, W, 38, "F");

    // Try to load FADA logo (prefer fada-logo.png)
    const logoCandidates = ["fada-logo.png", "fada-logo.jpg", "logo.png"];
    let logoLoaded = false;
    for (const candidate of logoCandidates) {
        try {
            const lp = path.join(process.cwd(), "public", candidate);
            if (fs.existsSync(lp)) {
                const ext  = candidate.endsWith(".jpg") ? "JPEG" : "PNG";
                const data = fs.readFileSync(lp).toString("base64");
                doc.addImage(`data:image/${ext.toLowerCase()};base64,${data}`, ext, 8, 6, 46, 24);
                logoLoaded = true;
                break;
            }
        } catch { /* continue */ }
    }
    if (!logoLoaded) {
        doc.setFont("Roboto", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text("FADA EXPRESS", 12, 22);
    }

    // "HOÁ ĐƠN DỊCH VỤ" on right of header
    doc.setFont("Roboto", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("HÓA ĐƠN DỊCH VỤ", W - 12, 18, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.text("AIR FREIGHT INVOICE", W - 12, 25, { align: "right" });

    // Invoice meta on right
    doc.setFontSize(8);
    doc.text(`Số HĐ: ${booking.reference}`, W - 12, 32, { align: "right" });
    doc.text(`Ngày: ${new Date().toLocaleDateString("vi-VN")}`, W - 12, 36.5, { align: "right" });

    // ── SECTION A: Company + Customer (two columns) ──────────────────
    let y = 46;

    // Left: company info box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(8, y, 90, 42, 3, 3, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(234, 88, 10);
    doc.text("NGƯỜI BÁN / SELLER", 12, y + 7);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(companyName, 12, y + 14);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const addrLines = doc.splitTextToSize(companyAddress, 82);
    doc.text(addrLines, 12, y + 20);
    doc.text(`${companyTax}`, 12, y + 27);
    doc.text(`Tel: ${companyPhone}`, 12, y + 32);
    doc.text(`Email: ${companyEmail}`, 12, y + 37);

    // Right: customer info box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(104, y, 98, 42, 3, 3, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(234, 88, 10);
    doc.text("NGƯỜI MUA / BUYER", 108, y + 7);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(booking.customer?.name || "N/A", 108, y + 14);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const custAddr = doc.splitTextToSize(booking.customer?.address || "N/A", 90);
    doc.text(custAddr, 108, y + 20);
    if (booking.customer?.taxCode) doc.text(`MST: ${booking.customer.taxCode}`, 108, y + 27);
    if (booking.customer?.phone)   doc.text(`Tel: ${booking.customer.phone}`, 108, y + 32);
    if (booking.customer?.email)   doc.text(`Email: ${booking.customer.email}`, 108, y + 37);

    // ── SECTION B: Shipment info strip ──────────────────────────────
    y += 48;
    doc.setFillColor(15, 23, 42);
    doc.rect(8, y, 194, 14, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    const shipCols = [
        { label: "MÃ AWB", value: booking.awbNumber || "PENDING" },
        { label: "HÀNH TRÌNH", value: `${booking.origin || "—"} → ${booking.destination || "—"}` },
        { label: "NGÀY GỬI", value: booking.shipDate ? new Date(booking.shipDate).toLocaleDateString("vi-VN") : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("vi-VN") : "—") },
        { label: "DỊCH VỤ", value: booking.service || "Air Freight" },
        { label: "SỐ KIỆN", value: String(booking.pieces || 1) },
        { label: "TL TÍNH CƯỚC", value: `${booking.chargeableWeight || booking.weight || 0} KG` },
    ];
    const colW = 194 / shipCols.length;
    shipCols.forEach((col, i) => {
        const cx = 8 + i * colW + colW / 2;
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(col.label, cx, y + 5, { align: "center" });
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(col.value, cx, y + 11, { align: "center" });
    });

    // ── SECTION C: Charges table ─────────────────────────────────────
    y += 20;
    const otherLabel = booking.otherFeeLabel || "Phí phát sinh khác";

    const rows: any[] = [
        ["1", "Cước vận chuyển hàng không\n(Air Freight Charge)", `${(booking.freightRevenue || 0).toLocaleString("vi-VN")} VND`],
    ];
    if ((booking.surcharge || 0) > 0) {
        rows.push(["2", "Phụ phí an ninh / nhiên liệu\n(Security & Fuel Surcharge)", `${(booking.surcharge || 0).toLocaleString("vi-VN")} VND`]);
    }
    if ((booking.otherFees || 0) > 0) {
        rows.push([String(rows.length + 1), `${otherLabel}\n(Other Charges)`, `${(booking.otherFees || 0).toLocaleString("vi-VN")} VND`]);
    }

    autoTable(doc, {
        startY: y,
        head: [["STT", "MÔ TẢ DỊCH VỤ / DESCRIPTION", "THÀNH TIỀN / AMOUNT"]],
        body: rows,
        theme: "grid",
        headStyles: {
            fillColor: [234, 88, 10],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
            fontSize: 8.5,
            cellPadding: 4,
            font: "Roboto",
        },
        styles: {
            fontSize: 8.5,
            cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
            font: "Roboto",
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 12 },
            1: { cellWidth: 130 },
            2: { halign: "right", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 8, right: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // ── SECTION D: Total box ─────────────────────────────────────────
    const tY = finalY + 6;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(8, tY, 194, 22, 3, 3, "F");

    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("TỔNG CỘNG THANH TOÁN / TOTAL AMOUNT DUE:", 14, tY + 9);
    doc.setFontSize(16);
    doc.setTextColor(234, 88, 10);
    doc.text(`${(booking.totalRevenue || 0).toLocaleString("vi-VN")} VND`, W - 14, tY + 12, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const payStatus = booking.paymentStatus === "PAID" ? "ĐÃ THANH TOÁN" : booking.paymentStatus === "PARTIAL" ? "THANH TOÁN MỘT PHẦN" : "CHƯA THANH TOÁN";
    doc.text(`Trạng thái: ${payStatus}  |  Đơn tham chiếu: ${booking.reference}`, 14, tY + 18);

    // ── SECTION E: Bank info ─────────────────────────────────────────
    let bY = tY + 30;
    if (bankInfo) {
        doc.setFillColor(255, 247, 237);
        doc.roundedRect(8, bY, 194, 20, 3, 3, "F");
        doc.setFont("Roboto", "bold");
        doc.setFontSize(8);
        doc.setTextColor(234, 88, 10);
        doc.text("THÔNG TIN THANH TOÁN / PAYMENT DETAILS", 14, bY + 7);
        doc.setFont("Roboto", "normal");
        doc.setTextColor(30, 41, 59);
        const bankLines = doc.splitTextToSize(bankInfo, 180);
        doc.text(bankLines.slice(0, 2), 14, bY + 13);
        bY += 24;
    }

    // ── SECTION F: Signatures ────────────────────────────────────────
    const sY = bY + 8;
    const sigBoxH = 32;

    // Left sig box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(8, sY, 88, sigBoxH, 2, 2, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("NGƯỜI LẬP BIỂU", 52, sY + 7, { align: "center" });
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("(Ký & ghi rõ họ tên)", 52, sY + 12, { align: "center" });

    // Right sig box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(114, sY, 88, sigBoxH, 2, 2, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("XÁC NHẬN KHÁCH HÀNG", 158, sY + 7, { align: "center" });
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("(Ký, đóng dấu & ghi rõ họ tên)", 158, sY + 12, { align: "center" });

    // ── FOOTER ───────────────────────────────────────────────────────
    doc.setFillColor(234, 88, 10);
    doc.rect(0, 286, W, 11, "F");
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(
        `${companyName}  |  ${companyPhone}  |  ${companyEmail}`,
        W / 2, 292.5,
        { align: "center" }
    );

    return Buffer.from(doc.output("arraybuffer"));
}
