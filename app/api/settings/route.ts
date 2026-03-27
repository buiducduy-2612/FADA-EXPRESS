import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        let setting = await prisma.appSetting.findUnique({ where: { id: "global" } });
        if (!setting) {
            setting = await prisma.appSetting.create({
                data: { id: "global", systemName: "FADA EXPRESS", logoUrl: "/fada-logo.png" }
            });
        }
        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const data = await req.json();
        
        const setting = await prisma.appSetting.upsert({
            where: { id: "global" },
            update: { 
                systemName: data.systemName, 
                logoUrl: data.logoUrl,
                companyName: data.companyName,
                companyAddress: data.companyAddress,
                companyPhone: data.companyPhone,
                companyEmail: data.companyEmail,
                companyTaxCode: data.companyTaxCode,
                companyBankInfo: data.companyBankInfo,
                companyCountry: data.companyCountry,
                companyState: data.companyState,
                companyCity: data.companyCity
            },
            create: { 
                id: "global", 
                systemName: data.systemName || "FADA EXPRESS", 
                logoUrl: data.logoUrl,
                companyName: data.companyName || "",
                companyAddress: data.companyAddress || "",
                companyPhone: data.companyPhone || "",
                companyEmail: data.companyEmail || "",
                companyTaxCode: data.companyTaxCode || "",
                companyBankInfo: data.companyBankInfo || "",
                companyCountry: data.companyCountry || "",
                companyState: data.companyState || "",
                companyCity: data.companyCity || ""
            }
        });
        
        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
