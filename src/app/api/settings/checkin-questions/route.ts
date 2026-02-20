import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const questionSchema = z.object({
    question: z.string().min(1, "Question is required"),
    scheduledDay: z.number().int().min(1, "Scheduled day is required"),
});

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const questions = await prisma.checkInQuestion.findMany({
        orderBy: [{ scheduledDay: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ questions });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const validation = questionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { scheduledDay, question } = validation.data;

        const maxOrder = await prisma.checkInQuestion.findFirst({
            where: { scheduledDay },
            orderBy: { sortOrder: "desc" },
        });

        const created = await prisma.checkInQuestion.create({
            data: {
                scheduledDay,
                question,
                sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
            },
        });

        return NextResponse.json({ question: created }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
}
