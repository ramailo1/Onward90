import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { buddyId } = await request.json();

    const onboarding = await prisma.onboarding.update({
        where: { id },
        data: { buddyId: buddyId || null },
        include: {
            buddy: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json({ onboarding });
}
