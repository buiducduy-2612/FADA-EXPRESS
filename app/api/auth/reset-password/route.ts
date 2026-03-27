import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token và mật khẩu mới là bắt buộc." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Mật khẩu phải có ít nhất 6 ký tự." },
                { status: 400 }
            );
        }

        // Find the token
        const resetToken = await (prisma as any).passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Link đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng." },
                { status: 400 }
            );
        }

        // Check if token has expired
        if (new Date() > new Date(resetToken.expiresAt)) {
            // Clean up expired token
            await (prisma as any).passwordResetToken.delete({
                where: { id: resetToken.id },
            });
            return NextResponse.json(
                { error: "Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới." },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        // Delete the used token
        await (prisma as any).passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        return NextResponse.json({
            message: "Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}
