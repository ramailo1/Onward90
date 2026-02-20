import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const [templates, onboardings, users] = await Promise.all([
        prisma.template.findMany({
            include: { _count: { select: { tasks: true, onboardings: true } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.onboarding.findMany({
            include: {
                newHire: true,
                manager: true,
                template: true,
                taskProgress: true,
                checkIns: true,
            },
        }),
        prisma.user.count(),
    ]);

    const activeOnboardings = onboardings.filter((o) => o.status === "ACTIVE");
    const completedOnboardings = onboardings.filter((o) => o.status === "COMPLETED");

    // Avg progress
    const avgProgress =
        activeOnboardings.length > 0
            ? Math.round(
                activeOnboardings.reduce((sum, ob) => {
                    const total = ob.taskProgress.length;
                    const done = ob.taskProgress.filter(
                        (tp) => tp.status === "DONE" || tp.status === "APPROVED"
                    ).length;
                    return sum + (total > 0 ? (done / total) * 100 : 0);
                }, 0) / activeOnboardings.length
            )
            : 0;

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="page-title">HR Command Center 🏢</h1>
                    <p className="page-subtitle">
                        Manage templates, monitor cohorts, and ensure every new hire succeeds
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href="/dashboard/admin/templates" className="btn btn-secondary">
                        📋 Templates
                    </Link>
                    <Link href="/dashboard/admin/onboardings" className="btn btn-primary">
                        🚀 New Onboarding
                    </Link>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Active Onboardings</div>
                        <div className="stat-card-value">{activeOnboardings.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Completed</div>
                        <div className="stat-card-value">{completedOnboardings.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Avg Progress</div>
                        <div className="stat-card-value">{avgProgress}%</div>
                        <div style={{ marginTop: "0.5rem" }}>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{ width: `${avgProgress}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Templates</div>
                        <div className="stat-card-value">{templates.length}</div>
                    </div>
                </div>

                {/* Active Onboardings Table */}
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
                    Active Onboardings
                </h2>

                {activeOnboardings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🚀</div>
                        <div className="empty-state-title">No active onboardings</div>
                        <div className="empty-state-desc">
                            Create a new onboarding to get started.
                        </div>
                        <Link href="/dashboard/admin/onboardings" className="btn btn-primary">
                            + Start Onboarding
                        </Link>
                    </div>
                ) : (
                    <div className="table-container" style={{ marginBottom: "2rem" }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>New Hire</th>
                                    <th>Template</th>
                                    <th>Manager</th>
                                    <th>Day</th>
                                    <th>Progress</th>
                                    <th>Check-ins</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOnboardings.map((ob) => {
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
                                    ).length;

                                    return (
                                        <tr key={ob.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <div className="avatar avatar-sm">
                                                        {ob.newHire.name.split(" ").map((n) => n[0]).join("")}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{ob.newHire.name}</div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
                                                            {ob.newHire.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{ob.template.name}</td>
                                            <td>{ob.manager.name}</td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{dayNum}</span>
                                                <span style={{ color: "var(--color-gray-400)" }}>/90</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <div className="progress-bar" style={{ width: "80px" }}>
                                                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral">{submittedCheckIns}/4</span>
                                            </td>
                                            <td>
                                                <span className="badge badge-success">Active</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Templates */}
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
                    📋 Templates
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {templates.map((tpl) => (
                        <div key={tpl.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{tpl.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                                        {tpl.department} · {tpl.roleTarget}
                                    </div>
                                </div>
                                <span className={`badge ${tpl.isActive ? "badge-success" : "badge-neutral"}`}>
                                    {tpl.isActive ? "Active" : "Draft"}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <span className="badge badge-neutral">{tpl._count.tasks} tasks</span>
                                <span className="badge badge-info">{tpl._count.onboardings} active</span>
                            </div>
                        </div>
                    ))}
                    <Link
                        href="/dashboard/admin/templates"
                        className="card"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px dashed var(--color-gray-300)",
                            color: "var(--color-gray-400)",
                            fontWeight: 600,
                            minHeight: "120px",
                        }}
                    >
                        + Create Template
                    </Link>
                </div>
            </div>
        </>
    );
}
