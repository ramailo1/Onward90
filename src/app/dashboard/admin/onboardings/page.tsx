"use client";

import { useState, useEffect } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
}

interface Template {
    id: string;
    name: string;
    department: string | null;
    roleTarget: string | null;
}

export default function OnboardingsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [newHireId, setNewHireId] = useState("");
    const [managerId, setManagerId] = useState("");
    const [buddyId, setBuddyId] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

    useEffect(() => {
        Promise.all([
            fetch("/api/users").then((r) => r.json()),
            fetch("/api/templates").then((r) => r.json()),
        ]).then(([userData, tplData]) => {
            setUsers(userData.users || []);
            setTemplates(tplData.templates || []);
            setLoading(false);
        });
    }, []);

    const createOnboarding = async () => {
        setCreating(true);
        setError("");
        const res = await fetch("/api/onboardings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newHireId, managerId, buddyId: buddyId || null, templateId, startDate }),
        });

        if (res.ok) {
            setSuccess("Onboarding created successfully! Tasks and check-ins have been initialized.");
            setNewHireId("");
            setManagerId("");
            setBuddyId("");
            setTimeout(() => setSuccess(""), 5000);
        } else {
            const data = await res.json();
            setError(data.error || "Failed to create onboarding");
        }
        setCreating(false);
    };

    // Filter users by role for each dropdown
    const newHires = users.filter((u) => u.role === "NEW_HIRE");
    const managers = users.filter((u) => u.role === "MANAGER" || u.role === "HR_ADMIN");

    // Buddy candidates: exclude the selected new hire and only show non-NEW_HIRE users
    const buddyCandidates = users.filter(
        (u) => u.id !== newHireId && u.role !== "NEW_HIRE"
    );

    if (loading) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">Start Onboarding 🚀</h1></div>
                <div className="page-body"><div className="skeleton" style={{ height: "200px" }} /></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Start Onboarding 🚀</h1>
                <p className="page-subtitle">Assign a template to a new hire and kick off their 90-day journey</p>
            </div>

            <div className="page-body" style={{ maxWidth: "640px" }}>
                {success && (
                    <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                        <span>🎉</span>
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                        <span>❌</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="card" style={{ padding: "2rem" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                        New Onboarding Setup
                    </h2>

                    <div className="form-group">
                        <label className="label">New Hire *</label>
                        <select className="select" value={newHireId} onChange={(e) => setNewHireId(e.target.value)}>
                            <option value="">Select new hire...</option>
                            {newHires.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        {newHires.length === 0 && (
                            <div className="form-hint" style={{ color: "var(--color-warning)" }}>
                                No users with &quot;New Hire&quot; role found. Add one in the People page first.
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Manager *</label>
                        <select className="select" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
                            <option value="">Select manager...</option>
                            {managers.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role === "HR_ADMIN" ? "HR Admin" : "Manager"}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="label">Onboarding Buddy (optional)</label>
                        <select className="select" value={buddyId} onChange={(e) => setBuddyId(e.target.value)}>
                            <option value="">Select buddy...</option>
                            {buddyCandidates.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department || u.role})</option>
                            ))}
                        </select>
                        <div className="form-hint">A peer who will help the new hire navigate their first weeks. Only non-new-hire team members are shown.</div>
                    </div>

                    <div className="form-group">
                        <label className="label">Template *</label>
                        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                            <option value="">Select template...</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} ({t.department} - {t.roleTarget})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="label">Start Date *</label>
                        <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        style={{ width: "100%", marginTop: "0.5rem" }}
                        onClick={createOnboarding}
                        disabled={creating || !newHireId || !managerId || !templateId}
                    >
                        {creating ? "Creating..." : "🚀 Start Onboarding"}
                    </button>
                </div>
            </div>
        </>
    );
}
