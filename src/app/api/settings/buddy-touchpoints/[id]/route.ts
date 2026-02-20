import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { day, label, description } = await request.json();

    const updated = await prisma.buddyTouchpoint.update({
        where: { id },
        data: {
            ...(day !== undefined && { day }),
            ...(label && { label }),
            description: description ?? undefined,
        },
    });

    return NextResponse.json({ touchpoint: updated });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.buddyTouchpoint.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
