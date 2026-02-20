import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { newHireId, managerId, buddyId, templateId, startDate } = body;

    if (!newHireId || !managerId || !templateId || !startDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the onboarding
    const onboarding = await prisma.onboarding.create({
        data: {
            newHireId,
            managerId,
            buddyId: buddyId || null,
            templateId,
            startDate: new Date(startDate),
            status: "ACTIVE",
        },
    });

    // Get template tasks and create task progress entries
    const templateTasks = await prisma.templateTask.findMany({
        where: { templateId },
    });

    await Promise.all(
        templateTasks.map((task) =>
            prisma.taskProgress.create({
                data: {
                    onboardingId: onboarding.id,
                    templateTaskId: task.id,
                    status: "PENDING",
                },
            })
        )
    );

    // Create check-ins for days 7, 30, 60, 90
    await Promise.all(
        [7, 30, 60, 90].map((day) =>
            prisma.checkIn.create({
                data: {
                    onboardingId: onboarding.id,
                    scheduledDay: day,
                    status: "PENDING",
                },
            })
        )
    );

    return NextResponse.json({ onboarding }, { status: 201 });
}
