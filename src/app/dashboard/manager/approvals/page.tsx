import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ApprovalsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;

    const onboardings = await prisma.onboarding.findMany({
        where: { managerId: userId },
        include: {
            newHire: true,
            template: true,
            taskProgress: {
                where: {
                    status: "DONE",
                    templateTask: { requiresApproval: true },
                },
                include: { templateTask: true },
            },
        },
    });

    const pendingApprovals = onboardings.flatMap((ob) =>
        ob.taskProgress.map((tp) => ({
            ...tp,
            newHireName: ob.newHire.name,
            templateName: ob.template.name,
        }))
    );

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Approvals ✅</h1>
                <p className="page-subtitle">
                    {pendingApprovals.length} task{pendingApprovals.length !== 1 ? "s" : ""} awaiting your approval
                </p>
            </div>

            <div className="page-body">
                {pendingApprovals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <div className="empty-state-title">All caught up!</div>
                        <div className="empty-state-desc">
                            No tasks need your approval right now. Great job staying on top of things.
                        </div>
                        <Link href="/dashboard/manager" className="btn btn-secondary">
                            ← Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {pendingApprovals.map((tp) => (
                            <div key={tp.id} className="task-card">
                                <div className="task-card-icon do">✅</div>
                                <div className="task-card-body">
                                    <div className="task-card-title">{tp.templateTask.title}</div>
                                    <div className="task-card-desc">
                                        {tp.templateTask.description}
                                    </div>
                                    <div className="task-card-meta">
                                        <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
                                            Day {tp.templateTask.dayNumber}
                                        </span>
                                        <span className="badge badge-info">{tp.newHireName}</span>
                                        <span className="badge badge-neutral">{tp.templateName}</span>
                                        {tp.evidenceUrl && (
                                            <a href={tp.evidenceUrl} target="_blank" rel="noopener" className="badge badge-primary" style={{ textDecoration: "none" }}>
                                                📎 Evidence
                                            </a>
                                        )}
                                    </div>
                                    {tp.completedAt && (
                                        <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", marginTop: "0.25rem" }}>
                                            Completed {new Date(tp.completedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="task-card-actions">
                                    <form action={`/api/tasks/${tp.id}/approve`} method="POST">
                                        <button type="submit" className="btn btn-primary btn-sm">
                                            Approve ✓
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
