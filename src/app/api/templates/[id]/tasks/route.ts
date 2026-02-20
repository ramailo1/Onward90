import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    taskType: z.enum(["DO_SUBMIT", "READ_ONLY", "MEET_BUDDY"]).optional(),
    dayNumber: z.number().int().min(1).optional(),
    weekNumber: z.number().int().min(1).optional(),
    requiresApproval: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const tasks = await prisma.templateTask.findMany({
        where: { templateId: id },
        orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ tasks });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const body = await request.json();
        const validation = taskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const data = validation.data;

        const task = await prisma.templateTask.create({
            data: {
                templateId: id,
                title: data.title,
                description: data.description || null,
                taskType: data.taskType || "DO_SUBMIT",
                dayNumber: data.dayNumber || 1,
                weekNumber: data.weekNumber || Math.ceil((data.dayNumber || 1) / 7),
                requiresApproval: data.requiresApproval || false,
                sortOrder: data.sortOrder || 0,
            },
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
}
