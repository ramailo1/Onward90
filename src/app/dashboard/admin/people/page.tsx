"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
}

interface OnboardingInfo {
    id: string;
    status: string;
    startDate: string;
    newHire: { id: string; name: string; email: string; department: string | null };
    manager: { name: string };
    buddy: { id: string; name: string } | null;
    template: { name: string };
    taskProgress: { status: string }[];
}

export default function PeoplePage() {
    const [users, setUsers] = useState<User[]>([]);
    const [onboardings, setOnboardings] = useState<OnboardingInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");

    // Add user form
    const [showAddUser, setShowAddUser] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("NEW_HIRE");
    const [newDepartment, setNewDepartment] = useState("");
    const [addError, setAddError] = useState("");

    // Edit user
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editDepartment, setEditDepartment] = useState("");

    // Edit buddy
    const [editingBuddyOb, setEditingBuddyOb] = useState<string | null>(null);
    const [newBuddyId, setNewBuddyId] = useState("");

    const [exportFilter, setExportFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

    // Confirm Dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        action: () => void;
    }>({ title: "", description: "", action: () => { } });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [userData, obData] = await Promise.all([
            fetch("/api/users").then((r) => r.json()),
            fetch("/api/onboardings/list").then((r) => r.json()),
        ]);
        setUsers(userData.users || []);
        setOnboardings(obData.onboardings || []);
        setLoading(false);
    };

    const addUser = async () => {
        setAddError("");
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName,
                email: newEmail,
                password: newPassword,
                role: newRole,
                department: newDepartment || null,
            }),
        });
        if (res.ok) {
            setShowAddUser(false);
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("NEW_HIRE");
            setNewDepartment("");
            fetchData();
        } else {
            const data = await res.json();
            setAddError(data.error || "Failed to add user");
        }
    };

    const updateUser = async () => {
        if (!editingUser) return;
        const res = await fetch(`/api/users/${editingUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: editName,
                role: editRole,
                department: editDepartment || null,
            }),
        });
        if (res.ok) {
            setEditingUser(null);
            fetchData();
        }
    };

    const startEditUser = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditRole(user.role);
        setEditDepartment(user.department || "");
    };

    const updateBuddy = async (onboardingId: string) => {
        const res = await fetch(`/api/onboardings/${onboardingId}/buddy`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buddyId: newBuddyId || null }),
        });
        if (res.ok) {
            setEditingBuddyOb(null);
            setNewBuddyId("");
            fetchData();
        }
    };

    const confirmDeleteUser = (user: User) => {
        setConfirmConfig({
            title: `Delete ${user.name}?`,
            description: "Are you sure you want to delete this user? This action cannot be undone.",
            action: () => deleteUser(user.id),
        });
        setConfirmOpen(true);
    };

    const deleteUser = async (userId: string) => {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        setConfirmOpen(false);
        if (res.ok) {
            setUsers(users.filter((u) => u.id !== userId));
        } else {
            const data = await res.json();
            alert(data.error || "Failed to delete user");
        }
    };

    const roleLabels: Record<string, { label: string; badge: string }> = {
        HR_ADMIN: { label: "HR Admin", badge: "badge-primary" },
        MANAGER: { label: "Manager", badge: "badge-info" },
        NEW_HIRE: { label: "New Hire", badge: "badge-success" },
    };

    const filteredUsers = users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department || "").toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    });

    const activeOnboardings = onboardings.filter((o) => o.status === "ACTIVE");
    const completedOnboardings = onboardings.filter((o) => o.status === "COMPLETED");
    const buddyCandidates = users.filter((u) => u.role !== "NEW_HIRE");

    const getTabData = () => {
        if (activeTab === "active") return activeOnboardings;
        if (activeTab === "completed") return completedOnboardings;
        return onboardings;
    };
    const tabData = getTabData();

    if (loading) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">People 👥</h1></div>
                <div className="page-body">
                    <div className="skeleton" style={{ height: "48px", marginBottom: "1rem" }} />
                    <div className="skeleton" style={{ height: "300px" }} />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="page-title">People 👥</h1>
                    <p className="page-subtitle">{users.length} team members · {activeOnboardings.length} actively onboarding</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
                        + Add Person
                    </button>
                    <div style={{ display: "flex", gap: "0" }}>
                        <select
                            className="select"
                            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: "none" }}
                            value={exportFilter}
                            onChange={(e) => setExportFilter(e.target.value as any)}
                        >
                            <option value="ALL">Export All</option>
                            <option value="ACTIVE">Export Active</option>
                            <option value="COMPLETED">Export Completed</option>
                        </select>
                        <a
                            href={`/api/export${exportFilter !== "ALL" ? `?status=${exportFilter}` : ""}`}
                            className="btn btn-secondary"
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            download
                        >
                            📥
                        </a>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Add User Form */}
                {showAddUser && (
                    <div className="card animate-fade-in" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Add New Person</h3>
                        {addError && (
                            <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
                                <span>❌</span><span>{addError}</span>
                            </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="label">Full Name *</label>
                                <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Jane Smith" />
                            </div>
                            <div className="form-group">
                                <label className="label">Email *</label>
                                <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@company.com" />
                            </div>
                            <div className="form-group">
                                <label className="label">Password *</label>
                                <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Temporary password" />
                            </div>
                            <div className="form-group">
                                <label className="label">Role *</label>
                                <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                    <option value="NEW_HIRE">🌱 New Hire</option>
                                    <option value="MANAGER">👤 Manager</option>
                                    <option value="HR_ADMIN">🏢 HR Admin</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="label">Department</label>
                                <input className="input" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="e.g. Engineering, Sales, Marketing" />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <button className="btn btn-secondary" onClick={() => { setShowAddUser(false); setAddError(""); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={addUser} disabled={!newName || !newEmail || !newPassword}>Add Person</button>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="card animate-fade-in" style={{ marginBottom: "1.5rem", padding: "1.5rem", border: "2px solid var(--color-primary)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                            Edit: {editingUser.name}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="label">Name</label>
                                <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="label">Role</label>
                                <select className="select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                                    <option value="NEW_HIRE">🌱 New Hire</option>
                                    <option value="MANAGER">👤 Manager</option>
                                    <option value="HR_ADMIN">🏢 HR Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Department</label>
                                <input className="input" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-hint" style={{ marginBottom: "0.5rem" }}>
                            Changing someone to &quot;Manager&quot; will let them see team dashboards and approve tasks.
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={updateUser}>Save Changes</button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", pointerEvents: "none" }}>🔍</span>
                        <input className="input" type="text" placeholder="Search by name, email, department, or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.5rem", fontSize: "0.9rem" }} />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-gray-100)" }}>
                    {[
                        { key: "active" as const, label: "In Progress", count: activeOnboardings.length, icon: "🚀" },
                        { key: "completed" as const, label: "Completed", count: completedOnboardings.length, icon: "✅" },
                        { key: "all" as const, label: "All People", count: users.length, icon: "👥" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: "0.75rem 1.25rem",
                                background: "none",
                                border: "none",
                                borderBottom: activeTab === tab.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                                marginBottom: "-2px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: activeTab === tab.key ? 600 : 400,
                                color: activeTab === tab.key ? "var(--color-primary)" : "var(--color-gray-500)",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            {tab.icon} {tab.label}
                            <span className={`badge ${activeTab === tab.key ? "badge-primary" : "badge-neutral"}`} style={{ fontSize: "0.65rem" }}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "all" ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const role = roleLabels[user.role] || { label: user.role, badge: "badge-neutral" };
                                    const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <div className="avatar avatar-sm">{initials}</div>
                                                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--color-gray-500)" }}>{user.email}</td>
                                            <td><span className={`badge ${role.badge}`}>{role.label}</span></td>
                                            <td>{user.department || "—"}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => confirmDeleteUser(user)}
                                                    title="Delete User"
                                                    style={{ color: "var(--color-danger)" }}
                                                >
                                                    🗑️
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => startEditUser(user)}
                                                >
                                                    Edit →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--color-gray-400)" }}>
                                            No results for &quot;{searchQuery}&quot;
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    tabData.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">{activeTab === "active" ? "🚀" : "🎓"}</div>
                            <div className="empty-state-title">{activeTab === "active" ? "No one currently onboarding" : "No completed onboardings yet"}</div>
                            <div className="empty-state-desc">{activeTab === "active" ? "Start a new onboarding to see team members here." : "Once someone completes their 90-day plan, they'll move here."}</div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>New Hire</th>
                                        <th>Template</th>
                                        <th>Manager</th>
                                        <th>Buddy</th>
                                        <th>Day</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tabData
                                        .filter((ob) => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase();
                                            return ob.newHire.name.toLowerCase().includes(q) || ob.newHire.email.toLowerCase().includes(q);
                                        })
                                        .map((ob) => {
                                            const total = ob.taskProgress.length;
                                            const done = ob.taskProgress.filter((tp) => tp.status === "DONE" || tp.status === "APPROVED").length;
                                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                            const startDate = new Date(ob.startDate);
                                            const dayNum = Math.min(90, Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
                                            const initials = ob.newHire.name.split(" ").map((n) => n[0]).join("").toUpperCase();

                                            return (
                                                <tr key={ob.id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <div className="avatar avatar-sm">{initials}</div>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{ob.newHire.name}</div>
                                                                <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>{ob.newHire.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{ob.template.name}</td>
                                                    <td>{ob.manager.name}</td>
                                                    <td>
                                                        {editingBuddyOb === ob.id ? (
                                                            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                                                <select className="select" value={newBuddyId} onChange={(e) => setNewBuddyId(e.target.value)} style={{ fontSize: "0.75rem", padding: "0.25rem", minWidth: "100px" }}>
                                                                    <option value="">None</option>
                                                                    {buddyCandidates.map((u) => (
                                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                                    ))}
                                                                </select>
                                                                <button className="btn btn-primary btn-sm" onClick={() => updateBuddy(ob.id)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}>Save</button>
                                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingBuddyOb(null)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                                <span>{ob.buddy?.name || "—"}</span>
                                                                {ob.status === "ACTIVE" && (
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingBuddyOb(ob.id); setNewBuddyId(ob.buddy?.id || ""); }} style={{ padding: "0.1rem 0.3rem", fontSize: "0.65rem" }}>✏️</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td><span style={{ fontWeight: 600 }}>{dayNum}</span><span style={{ color: "var(--color-gray-400)" }}>/90</span></td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <div className="progress-bar" style={{ width: "80px" }}>
                                                                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${ob.status === "ACTIVE" ? "badge-success" : ob.status === "COMPLETED" ? "badge-primary" : "badge-neutral"}`}>
                                                            {ob.status === "ACTIVE" ? "In Progress" : ob.status === "COMPLETED" ? "Completed" : ob.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title={confirmConfig.title}
                description={confirmConfig.description}
                onConfirm={confirmConfig.action}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}
