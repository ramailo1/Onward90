import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Check if template has active onboardings
    const activeOnboardings = await prisma.onboarding.count({
        where: { templateId: id, status: "ACTIVE" },
    });

    if (activeOnboardings > 0) {
        return NextResponse.json(
            { error: "Cannot delete template with active onboardings. Complete or pause them first." },
            { status: 400 }
        );
    }

    try {
        // Delete in order: check-in responses → check-ins → task progress → onboardings → template tasks → template
        const onboardings = await prisma.onboarding.findMany({
            where: { templateId: id },
            select: { id: true },
        });

        const onboardingIds = onboardings.map((o) => o.id);

        if (onboardingIds.length > 0) {
            // Delete check-in responses for these onboardings
            await prisma.checkInResponse.deleteMany({
                where: { checkIn: { onboardingId: { in: onboardingIds } } },
            });

            // Delete check-ins
            await prisma.checkIn.deleteMany({
                where: { onboardingId: { in: onboardingIds } },
            });

            // Delete task progress
            await prisma.taskProgress.deleteMany({
                where: { onboardingId: { in: onboardingIds } },
            });

            // Delete onboardings
            await prisma.onboarding.deleteMany({
                where: { templateId: id },
            });
        }

        // Delete template (tasks cascade automatically via schema)
        await prisma.template.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Template delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete template. It may have dependent data." },
            { status: 500 }
        );
    }
}
