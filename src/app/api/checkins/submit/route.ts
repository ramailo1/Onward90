import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { checkInId, responses } = body;

        if (!checkInId || !responses || !Array.isArray(responses)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Verify check-in belongs to user
        const checkIn = await prisma.checkIn.findUnique({
            where: { id: checkInId },
            include: { onboarding: true },
        });

        if (!checkIn) {
            return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        if (checkIn.onboarding.newHireId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create responses and update check-in
        await prisma.$transaction([
            ...responses.map((r: { question: string; rating: number; answer?: string; visibility?: string }) =>
                prisma.checkInResponse.create({
                    data: {
                        checkInId,
                        question: r.question,
                        rating: r.rating,
                        answer: r.answer || "",
                        visibility: r.visibility || "MANAGER_HR",
                    },
                })
            ),
            prisma.checkIn.update({
                where: { id: checkInId },
                data: {
                    status: "SUBMITTED",
                    submittedAt: new Date(),
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Check-in submission error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
