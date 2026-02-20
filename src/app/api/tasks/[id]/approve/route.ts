import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const taskProgress = await prisma.taskProgress.findUnique({
        where: { id },
        include: { onboarding: true },
    });

    if (!taskProgress) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only managers can approve
    const userId = (session.user as any).id;
    if (taskProgress.onboarding.managerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.taskProgress.update({
        where: { id },
        data: {
            status: "APPROVED",
            approvedAt: new Date(),
        },
    });

    return NextResponse.redirect(new URL("/dashboard/manager", request.url));
}
