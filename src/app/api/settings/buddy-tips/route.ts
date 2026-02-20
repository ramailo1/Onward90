import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tips = await prisma.buddyTip.findMany({
        orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ tips });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tip } = await request.json();

    const maxOrder = await prisma.buddyTip.findFirst({
        orderBy: { sortOrder: "desc" },
    });

    const created = await prisma.buddyTip.create({
        data: {
            tip,
            sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
    });

    return NextResponse.json({ tip: created }, { status: 201 });
}
