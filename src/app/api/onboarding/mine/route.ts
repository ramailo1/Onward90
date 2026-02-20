import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const onboarding = await prisma.onboarding.findFirst({
        where: { newHireId: userId },
        include: {
            buddy: { select: { name: true, email: true, department: true } },
            manager: { select: { name: true } },
        },
    });

    return NextResponse.json({ onboarding });
}
