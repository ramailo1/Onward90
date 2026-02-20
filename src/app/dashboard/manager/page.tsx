import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManagerDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;

    const onboardings = await prisma.onboarding.findMany({
        where: { managerId: userId },
        include: {
            newHire: true,
            buddy: true,
            template: true,
            taskProgress: {
                include: { templateTask: true },
            },
            checkIns: {
                include: { responses: true },
                orderBy: { scheduledDay: "desc" },
            },
        },
    });

    // Tasks needing approval
    const pendingApprovals = onboardings.flatMap((ob) =>
        ob.taskProgress
            .filter((tp) => tp.status === "DONE" && tp.templateTask.requiresApproval)
            .map((tp) => ({ ...tp, newHireName: ob.newHire.name, onboardingId: ob.id }))
    );

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Manager Dashboard 👤</h1>
                <p className="page-subtitle">
                    Track your team&apos;s onboarding progress and support their journey
                </p>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Active Onboardings</div>
                        <div className="stat-card-value">
                            {onboardings.filter((o) => o.status === "ACTIVE").length}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Pending Approvals</div>
                        <div className="stat-card-value" style={{ color: pendingApprovals.length > 0 ? "var(--color-warning)" : undefined }}>
                            {pendingApprovals.length}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Total Team Members</div>
                        <div className="stat-card-value">{onboardings.length}</div>
                    </div>
                </div>

                {/* Pending Approvals */}
                {pendingApprovals.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
                            ✅ Pending Approvals
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {pendingApprovals.map((tp) => (
                                <div key={tp.id} className="task-card">
                                    <div className="task-card-icon do">✅</div>
                                    <div className="task-card-body">
                                        <div className="task-card-title">{tp.templateTask.title}</div>
                                        <div className="task-card-desc">
                                            Completed by <strong>{tp.newHireName}</strong>
                                            {tp.evidenceUrl && (
                                                <> — <a href={tp.evidenceUrl} target="_blank" rel="noopener">View evidence</a></>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-card-actions">
                                        <form action={`/api/tasks/${tp.id}/approve`} method="POST">
                                            <button type="submit" className="btn btn-primary btn-sm">
                                                Approve
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team Members */}
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
                    👥 Team Onboarding Progress
                </h2>

                {onboardings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">No team members onboarding</div>
                        <div className="empty-state-desc">
                            When HR assigns new hires to you, they&apos;ll appear here.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
                        {onboardings.map((ob) => {
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

                            const latestCheckIn = ob.checkIns.find((ci) => ci.status === "SUBMITTED");
                            const avgRating = latestCheckIn
                                ? latestCheckIn.responses.reduce((sum, r) => sum + (r.rating || 0), 0) /
                                (latestCheckIn.responses.filter((r) => r.rating).length || 1)
                                : null;

                            const initials = ob.newHire.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase();

                            return (
                                <div key={ob.id} className="card">
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                                        <div className="avatar">{initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{ob.newHire.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                                                {ob.template.name} · Day {dayNum}
                                            </div>
                                        </div>
                                        <span className={`badge ${ob.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                                            {ob.status}
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: "0.75rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                                            <span style={{ color: "var(--color-gray-500)" }}>Progress</span>
                                            <span style={{ fontWeight: 600 }}>{pct}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", flexWrap: "wrap" }}>
                                        <span className="badge badge-neutral">
                                            {done}/{total} tasks
                                        </span>
                                        {ob.buddy && (
                                            <span className="badge badge-info">
                                                Buddy: {ob.buddy.name.split(" ")[0]}
                                            </span>
                                        )}
                                        {avgRating !== null && (
                                            <span className={`badge ${avgRating >= 4 ? "badge-success" : avgRating >= 3 ? "badge-warning" : "badge-danger"}`}>
                                                Satisfaction: {avgRating.toFixed(1)}/5
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
