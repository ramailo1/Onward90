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
        include: { templateTask: true, onboarding: true },
    });

    if (!taskProgress) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Parse optional evidence/notes from body
    let evidence: string | undefined;
    let notes: string | undefined;
    try {
        const body = await request.json();
        evidence = body.evidenceUrl;
        notes = body.notes;
    } catch {
        // No body, that's fine
    }

    if (taskProgress.status === "PENDING") {
        await prisma.taskProgress.update({
            where: { id },
            data: { status: "IN_PROGRESS" },
        });
    } else if (taskProgress.status === "IN_PROGRESS") {
        await prisma.taskProgress.update({
            where: { id },
            data: {
                status: taskProgress.templateTask.requiresApproval ? "DONE" : "DONE",
                completedAt: new Date(),
                evidenceUrl: evidence || taskProgress.evidenceUrl,
                notes: notes || taskProgress.notes,
            },
        });
    }

    // Redirect back to dashboard
    const userRole = (session.user as any).role;
    const redirectPath = userRole === "NEW_HIRE"
        ? "/dashboard/new-hire"
        : "/dashboard/manager";

    return NextResponse.redirect(new URL(redirectPath, request.url));
}
