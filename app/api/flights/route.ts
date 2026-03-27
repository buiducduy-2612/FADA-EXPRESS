import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const flights = await prisma.flight.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(flights);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const flight = await prisma.flight.create({
            data: json,
        });
        return NextResponse.json(flight);
    } catch (error) {
        console.error("Failed to create flight:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
