import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { checkInId, responses } = await request.json();

    if (!checkInId || !responses) {
        return NextResponse.json({ error: "checkInId and responses are required" }, { status: 400 });
    }

    // Verify check-in belongs to user
    const userId = (session.user as any).id;
    const checkIn = await prisma.checkIn.findUnique({
        where: { id: checkInId },
        include: { onboarding: true },
    });

    if (!checkIn || checkIn.onboarding.newHireId !== userId) {
        return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
    }

    // Delete existing responses and create new ones
    await prisma.checkInResponse.deleteMany({
        where: { checkInId },
    });

    await prisma.$transaction(
        responses.map((r: any) =>
            prisma.checkInResponse.create({
                data: {
                    checkInId,
                    question: r.question,
                    rating: r.rating,
                    answer: r.answer || null,
                    visibility: r.visibility || "MANAGER_HR",
                },
            })
        )
    );

    // Update check-in status
    await prisma.checkIn.update({
        where: { id: checkInId },
        data: { status: "SUBMITTED", submittedAt: new Date() },
    });

    return NextResponse.json({ success: true });
}
