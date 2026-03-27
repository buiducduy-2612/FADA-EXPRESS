import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not configured");
        return { success: false, error: "Email not configured" };
    }

    try {
        const info = await transporter.sendMail({
            from: `"FADA EXPRESS" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments,
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error };
    }
}

export function replacePlaceholders(template: string, data: Record<string, any>) {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

export const DEFAULT_BOOKING_TEMPLATE = `
<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
    <!-- Header with Gradient -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 40px; text-align: center;">
        <div style="display: inline-block; padding: 12px 24px; background: rgba(255, 255, 255, 0.05); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">FADA LOGISTICS</h1>
        </div>
        <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4em; margin: 0;">Global Air Freight Excellence</p>
    </div>
    
    <!-- Content Section -->
    <div style="padding: 50px 40px;">
        <div style="margin-bottom: 40px;">
            <p style="color: #64748b; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">Shipment Confirmation</p>
            <h2 style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.03em;">Booking {{reference}}</h2>
        </div>

        <div style="margin-bottom: 40px; color: #334155; font-size: 16px; line-height: 1.8;">
            <p>Dear <strong style="color: #0f172a;">{{customer_name}}</strong>,</p>
            <p>We are pleased to inform you that your shipment is now being processed. Our operations team has confirmed the details and is preparing for transit.</p>
        </div>

        <!-- Shipment Card -->
        <div style="background-color: #f8fafc; border-radius: 20px; border: 1px solid #f1f5f9; padding: 32px; margin-bottom: 40px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding-bottom: 24px;">
                        <span style="display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">MAWB / AWB Number</span>
                        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">{{awb}}</span>
                    </td>
                    <td style="padding-bottom: 24px; text-align: right;">
                        <span style="display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Total Weight</span>
                        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">{{weight}} KGS</span>
                    </td>
                </tr>
                <tr>
                    <td style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                        <span style="display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Origin</span>
                        <span style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase;">{{origin}}</span>
                    </td>
                    <td style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: right;">
                        <span style="display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Destination</span>
                        <span style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase;">{{destination}}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Action Area -->
        <div style="text-align: center; border-top: 2px dashed #f1f5f9; padding-top: 40px;">
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                Your professional invoice and shipment manifest are attached to this message as a high-resolution PDF document.
            </p>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 11px; font-weight: 600; margin: 0 0 12px 0;">© 2026 FADA LOGISTICS CO., LTD.</p>
        <p style="color: #cbd5e1; font-size: 10px; font-weight: 500; margin: 0;">Tân Bình, Ho Chi Minh City, Vietnam • info@fada-logistics.com</p>
    </div>
</div>
`;
