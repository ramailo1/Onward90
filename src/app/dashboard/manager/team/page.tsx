import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ManagerTeamPage() {
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
        },
    });

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">My Team 👥</h1>
                <p className="page-subtitle">
                    {onboardings.length} team member{onboardings.length !== 1 ? "s" : ""} currently onboarding
                </p>
            </div>

            <div className="page-body">
                {onboardings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">No team members onboarding</div>
                        <div className="empty-state-desc">
                            When HR assigns new hires to you, they&apos;ll appear here.
                        </div>
                        <Link href="/dashboard/manager" className="btn btn-secondary">
                            ← Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {onboardings.map((ob) => {
                            const total = ob.taskProgress.length;
                            const done = ob.taskProgress.filter(
                                (tp) => tp.status === "DONE" || tp.status === "APPROVED"
                            ).length;
                            const inProgress = ob.taskProgress.filter((tp) => tp.status === "IN_PROGRESS").length;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                            const startDate = new Date(ob.startDate);
                            const dayNum = Math.min(
                                90,
                                Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
                            );

                            const initials = ob.newHire.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase();

                            // Upcoming tasks (next 3)
                            const upcoming = ob.taskProgress
                                .filter((tp) => tp.status === "PENDING" || tp.status === "IN_PROGRESS")
                                .sort((a, b) => a.templateTask.dayNumber - b.templateTask.dayNumber)
                                .slice(0, 3);

                            return (
                                <div key={ob.id} className="card">
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                        <div className="avatar avatar-lg">{initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{ob.newHire.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
                                                {ob.newHire.email} · {ob.template.name}
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                                <span className={`badge ${ob.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                                                    Day {dayNum}/90
                                                </span>
                                                {ob.buddy && (
                                                    <span className="badge badge-info">Buddy: {ob.buddy.name}</span>
                                                )}
                                                {!ob.buddy && (
                                                    <span className="badge badge-warning">No buddy assigned</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-primary)" }}>
                                                {pct}%
                                            </div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
                                                {done}/{total} tasks
                                            </div>
                                        </div>
                                    </div>

                                    <div className="progress-bar" style={{ marginBottom: "1rem" }}>
                                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                    </div>

                                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
                                        <div>
                                            <span style={{ color: "var(--color-gray-500)" }}>Completed: </span>
                                            <strong>{done}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: "var(--color-gray-500)" }}>In Progress: </span>
                                            <strong>{inProgress}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: "var(--color-gray-500)" }}>Pending: </span>
                                            <strong>{total - done - inProgress}</strong>
                                        </div>
                                    </div>

                                    {upcoming.length > 0 && (
                                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-gray-100)" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-400)", marginBottom: "0.5rem" }}>
                                                Next Up
                                            </div>
                                            {upcoming.map((tp) => (
                                                <div key={tp.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", padding: "0.25rem 0" }}>
                                                    <span style={{ flexShrink: 0 }}>
                                                        {tp.templateTask.taskType === "READ" ? "📖" : tp.templateTask.taskType === "MEETING" ? "📅" : tp.templateTask.taskType === "ACKNOWLEDGE" ? "📋" : "✅"}
                                                    </span>
                                                    <span style={{ color: "var(--color-gray-700)" }}>{tp.templateTask.title}</span>
                                                    <span style={{ marginLeft: "auto", color: "var(--color-gray-400)", fontSize: "0.7rem" }}>
                                                        Day {tp.templateTask.dayNumber}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
