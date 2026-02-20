import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status");
    const where = status ? { status: status } : {};

    const onboardings = await prisma.onboarding.findMany({
        where,
        include: {
            newHire: true,
            manager: true,
            buddy: true,
            template: true,
            taskProgress: true,
            checkIns: {
                include: { responses: true },
            },
        },
    });

    // Build CSV
    const headers = [
        "New Hire",
        "Email",
        "Template",
        "Manager",
        "Buddy",
        "Start Date",
        "Current Day",
        "Status",
        "Tasks Total",
        "Tasks Completed",
        "Progress %",
        "Check-ins Completed",
        "Avg Satisfaction",
    ];

    const rows = onboardings.map((ob) => {
        const total = ob.taskProgress.length;
        const done = ob.taskProgress.filter(
            (tp) => tp.status === "DONE" || tp.status === "APPROVED"
        ).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const startDate = new Date(ob.startDate);
        const dayNum = Math.min(
            90,
            Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        );

        const submittedCheckIns = ob.checkIns.filter(
            (ci) => ci.status === "SUBMITTED" || ci.status === "REVIEWED"
        );
        const allRatings = submittedCheckIns.flatMap((ci) =>
            ci.responses.filter((r) => r.rating).map((r) => r.rating!)
        );
        const avgRating =
            allRatings.length > 0
                ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
                : "N/A";

        return [
            ob.newHire.name,
            ob.newHire.email,
            ob.template.name,
            ob.manager.name,
            ob.buddy?.name || "Not assigned",
            startDate.toISOString().split("T")[0],
            dayNum,
            ob.status,
            total,
            done,
            pct,
            submittedCheckIns.length,
            avgRating,
        ];
    });

    const csv = [headers, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="onboarding-report-${new Date().toISOString().split("T")[0]
                }.csv"`,
        },
    });
}
