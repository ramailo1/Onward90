import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewHireDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;

    const onboarding = await prisma.onboarding.findFirst({
        where: { newHireId: userId },
        include: {
            template: true,
            buddy: true,
            manager: true,
            taskProgress: {
                include: { templateTask: true },
                orderBy: { templateTask: { dayNumber: "asc" } },
            },
            checkIns: {
                orderBy: { scheduledDay: "asc" },
            },
        },
    });

    if (!onboarding) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Welcome! 🌱</h1>
                    <p className="page-subtitle">Your onboarding hasn&apos;t started yet</p>
                </div>
                <div className="page-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">No onboarding assigned</div>
                        <div className="empty-state-desc">
                            Your HR team will set up your onboarding plan soon. Check back shortly!
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const startDate = new Date(onboarding.startDate);
    const today = new Date();
    const currentDay = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const totalTasks = onboarding.taskProgress.length;
    const completedTasks = onboarding.taskProgress.filter(
        (tp) => tp.status === "DONE" || tp.status === "APPROVED"
    ).length;
    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Group tasks by week
    const tasksByWeek = new Map<number, typeof onboarding.taskProgress>();
    onboarding.taskProgress.forEach((tp) => {
        const week = tp.templateTask.weekNumber;
        if (!tasksByWeek.has(week)) tasksByWeek.set(week, []);
        tasksByWeek.get(week)!.push(tp);
    });

    const currentWeek = Math.min(13, Math.ceil(currentDay / 7));

    const taskTypeIcons: Record<string, { icon: string; className: string }> = {
        READ: { icon: "📖", className: "read" },
        MEETING: { icon: "📅", className: "meeting" },
        DO_SUBMIT: { icon: "✅", className: "do" },
        ACKNOWLEDGE: { icon: "📋", className: "acknowledge" },
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            PENDING: { label: "Pending", className: "badge-neutral" },
            IN_PROGRESS: { label: "In Progress", className: "badge-warning" },
            DONE: { label: "Done", className: "badge-success" },
            APPROVED: { label: "Approved ✓", className: "badge-primary" },
        };
        const s = map[status] || map.PENDING;
        return <span className={`badge ${s.className}`}>{s.label}</span>;
    };

    const pendingCheckIn = onboarding.checkIns.find(
        (ci) => ci.status === "PENDING" && ci.scheduledDay <= currentDay
    );

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">
                    Welcome, {session.user.name?.split(" ")[0]}! 🌱
                </h1>
                <p className="page-subtitle">
                    Day {Math.min(currentDay, 90)} of 90 — {onboarding.template.name}
                </p>
            </div>

            <div className="page-body">
                {/* Alert for pending check-in */}
                {pendingCheckIn && (
                    <div className="alert alert-info" style={{ marginBottom: "1.5rem" }}>
                        <span>💬</span>
                        <div>
                            <strong>Day {pendingCheckIn.scheduledDay} Check-in is due!</strong>
                            <br />
                            <span style={{ fontSize: "0.8rem" }}>
                                Take a few minutes to share how your onboarding is going.
                            </span>
                            <br />
                            <Link
                                href="/dashboard/new-hire/checkins"
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: "0.5rem" }}
                            >
                                Complete Check-in →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Current Day</div>
                        <div className="stat-card-value">{Math.min(currentDay, 90)}</div>
                        <div className="stat-card-change" style={{ color: "var(--color-gray-500)" }}>
                            of 90 days
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Progress</div>
                        <div className="stat-card-value">{progressPct}%</div>
                        <div style={{ marginTop: "0.5rem" }}>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Tasks Complete</div>
                        <div className="stat-card-value">
                            {completedTasks}/{totalTasks}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Your Buddy</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                            <div className="avatar avatar-sm">
                                {onboarding.buddy?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "?"}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                    {onboarding.buddy?.name || "Not assigned"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-gray-900)" }}>
                    Your Timeline
                </h2>

                <div className="timeline">
                    {Array.from(tasksByWeek.entries())
                        .sort(([a], [b]) => a - b)
                        .map(([week, tasks]) => {
                            const isCurrentWeek = week === currentWeek;
                            const isPastWeek = week < currentWeek;
                            const weekComplete = tasks.every(
                                (t) => t.status === "DONE" || t.status === "APPROVED"
                            );

                            return (
                                <div key={week} className="timeline-item">
                                    <div
                                        className={`timeline-marker ${weekComplete ? "completed" : isCurrentWeek ? "active" : ""
                                            }`}
                                    />
                                    <div className="timeline-label">
                                        Week {week} {isCurrentWeek && "← You are here"}{" "}
                                        {weekComplete && "✓"}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {tasks.map((tp) => {
                                            const typeInfo = taskTypeIcons[tp.templateTask.taskType] || taskTypeIcons.DO_SUBMIT;
                                            return (
                                                <div
                                                    key={tp.id}
                                                    className={`task-card ${tp.status === "DONE" || tp.status === "APPROVED" ? "completed" : ""}`}
                                                >
                                                    <div className={`task-card-icon ${typeInfo.className}`}>
                                                        {typeInfo.icon}
                                                    </div>
                                                    <div className="task-card-body">
                                                        <div className="task-card-title">
                                                            {tp.templateTask.title}
                                                        </div>
                                                        <div className="task-card-desc">
                                                            {tp.templateTask.description}
                                                        </div>
                                                        <div className="task-card-meta">
                                                            <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
                                                                Day {tp.templateTask.dayNumber}
                                                            </span>
                                                            {tp.templateTask.requiresApproval && (
                                                                <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>
                                                                    Needs approval
                                                                </span>
                                                            )}
                                                            {statusBadge(tp.status)}
                                                        </div>
                                                    </div>
                                                    <div className="task-card-actions">
                                                        {(tp.status === "PENDING" || tp.status === "IN_PROGRESS") && (
                                                            <form action={`/api/tasks/${tp.id}/complete`} method="POST">
                                                                <button type="submit" className="btn btn-primary btn-sm">
                                                                    {tp.status === "PENDING" ? "Start" : "Complete"}
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </>
    );
}
