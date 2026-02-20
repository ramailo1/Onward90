import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const milestones = await prisma.milestone.findMany({
        orderBy: { day: "asc" },
    });

    return NextResponse.json({ milestones });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { day, label, description } = await request.json();

    try {
        const created = await prisma.milestone.create({
            data: {
                day: parseInt(day),
                label,
                description,
                sortOrder: parseInt(day),
            },
        });
        return NextResponse.json({ milestone: created }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: "Milestone for this day already exists" }, { status: 400 });
    }
}
