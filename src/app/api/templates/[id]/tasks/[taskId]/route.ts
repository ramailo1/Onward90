import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;

    await prisma.templateTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const body = await request.json();

    // Whitelist allowed fields to update
    const { title, description, taskType, weekNumber, dayNumber, requiresApproval } = body;

    const updatedTask = await prisma.templateTask.update({
        where: { id: taskId },
        data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(taskType && { taskType }),
            ...(dayNumber && { dayNumber }),
            ...(weekNumber && { weekNumber }),
            ...(requiresApproval !== undefined && { requiresApproval }),
        },
    });

    return NextResponse.json({ task: updatedTask });
}
