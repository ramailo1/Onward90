import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const templateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    department: z.string().optional().nullable(),
    roleTarget: z.string().optional().nullable(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const templates = await prisma.template.findMany({
        include: { _count: { select: { tasks: true, onboardings: true } } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const validation = templateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { name, department, roleTarget } = validation.data;

        const template = await prisma.template.create({
            data: {
                name,
                department: department || null,
                roleTarget: roleTarget || null,
                createdById: (session.user as any).id,
            },
        });

        return NextResponse.json({ template }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
}
