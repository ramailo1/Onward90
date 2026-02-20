import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const touchpoints = await prisma.buddyTouchpoint.findMany({
        orderBy: [{ day: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ touchpoints });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { day, label, description } = await request.json();

    const created = await prisma.buddyTouchpoint.create({
        data: { day, label, description: description || null, sortOrder: 0 },
    });

    return NextResponse.json({ touchpoint: created }, { status: 201 });
}
