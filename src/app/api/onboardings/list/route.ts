import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const onboardings = await prisma.onboarding.findMany({
        include: {
            newHire: { select: { id: true, name: true, email: true, department: true } },
            manager: { select: { name: true } },
            buddy: { select: { id: true, name: true } },
            template: { select: { name: true } },
            taskProgress: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ onboardings });
}
