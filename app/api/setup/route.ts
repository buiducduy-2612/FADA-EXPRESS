import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const email = "admin@logictis.com";
        const password = process.env.ADMIN_SETUP_PASSWORD;
        if (!password) {
            return NextResponse.json({ error: "ADMIN_SETUP_PASSWORD environment variable is not set." }, { status: 500 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            await prisma.user.update({
                where: { email },
                data: { 
                    password: hashedPassword,
                    role: "ADMIN"
                }
            });
            return NextResponse.json({ message: "Admin password reset successfully." });
        } else {
            await prisma.user.create({
                data: {
                    name: "System Admin",
                    email,
                    password: hashedPassword,
                    role: "ADMIN"
                }
            });
            return NextResponse.json({ message: "Admin user created successfully." });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
