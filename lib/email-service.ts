import prisma from "./prisma";
import { sendEmail, replacePlaceholders, DEFAULT_BOOKING_TEMPLATE } from "./mail";
import { generateInvoicePdf } from "./pdf";

export async function sendInvoiceEmail(bookingId: string, customEmails?: string[]) {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { customer: true }
        });

        if (!booking || (!booking.customer?.email && (!customEmails || customEmails.length === 0))) {
            throw new Error("Booking or customer email not found");
        }
        
        const recipientList = customEmails && customEmails.length > 0 
            ? customEmails 
            : [booking.customer.email];

        // 1. Get Template (or use default)
        let template = await (prisma as any).emailTemplate.findUnique({
            where: { name: "INVOICE" }
        });

        const subject = template?.subject || `Hoá đơn đơn hàng ${booking.reference}`;
        const bodyContent = template?.body || DEFAULT_BOOKING_TEMPLATE;

        // 2. Prepare Placeholders
        const placeholders = {
            customer_name: booking.customer.name,
            reference: booking.reference,
            awb: booking.awbNumber || "PENDING",
            origin: booking.origin,
            destination: booking.destination,
            pieces: booking.pieces.toString(),
            weight: booking.chargeableWeight.toString(),
            amount: booking.totalRevenue.toLocaleString() + " VND"
        };

        const html = replacePlaceholders(bodyContent, placeholders);

        // 3. Generate PDF
        const pdfBuffer = await generateInvoicePdf(booking);

        // 4. Send Email
        const result = await sendEmail({
            to: recipientList.join(","),
            subject,
            html,
            attachments: [
                {
                    filename: `Invoice_${booking.reference}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });

        return result;
    } catch (error) {
        console.error("sendInvoiceEmail error:", error);
        return { success: false, error: (error as Error).message };
    }
}
