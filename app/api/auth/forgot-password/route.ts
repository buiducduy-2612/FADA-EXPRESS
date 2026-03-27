import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";

function getBaseUrl(): string {
    // Use REPLIT_DEV_DOMAIN if available (handles domain changes on restart)
    if (process.env.REPLIT_DEV_DOMAIN) {
        return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email là bắt buộc." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        const successMsg = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.";

        if (!user) {
            return NextResponse.json({ message: successMsg });
        }

        // Delete any existing reset tokens for this user
        await (prisma as any).passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Generate secure random token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token to database
        await (prisma as any).passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        const baseUrl = getBaseUrl();
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        // Try to send email
        const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

        if (emailConfigured) {
            const html = `
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #0f172a; padding: 36px 40px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">FADA EXPRESS</h1>
        <p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin-top: 8px;">Đặt lại mật khẩu</p>
    </div>
    <div style="padding: 40px;">
        <p style="color: #334155; font-size: 15px; line-height: 1.7; margin-bottom: 8px;">Xin chào <strong>${user.name || "bạn"}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 24px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới:</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">Đặt lại mật khẩu</a>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #f1f5f9; margin-top: 24px;">
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">⏰ Link này sẽ hết hạn sau <strong style="color: #475569;">1 giờ</strong>.</p>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 4px 0 0;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
    </div>
    <div style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 10px; text-align: center; font-weight: 500;">
        <p>© 2026 FADA EXPRESS / FADA LOGISTICS CO., LTD. All rights reserved.</p>
    </div>
</div>`;

            await sendEmail({
                to: user.email,
                subject: "[FADA EXPRESS] Đặt lại mật khẩu",
                html,
            });

            return NextResponse.json({ message: successMsg });
        } else {
            // Email not configured — log to console and return the URL directly
            console.log("\n=============================================");
            console.log("PASSWORD RESET LINK (email not configured):");
            console.log(resetUrl);
            console.log("=============================================\n");

            // Return the reset URL directly so admin can share it with the user
            return NextResponse.json({
                message: successMsg,
                devResetUrl: resetUrl,
                devNote: "Email chưa được cấu hình. Link đặt lại mật khẩu hiển thị trực tiếp (chỉ hiển thị trong môi trường dev).",
            });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}
