"use client";

import { useState, useEffect } from "react";

interface CheckInQuestion {
    id: string;
    scheduledDay: number;
    question: string;
    sortOrder: number;
}

interface BuddyTouchpoint {
    id: string;
    day: number;
    label: string;
    description: string | null;
    sortOrder: number;
}

interface BuddyTip {
    id: string;
    tip: string;
    sortOrder: number;
}

interface Milestone {
    id: string;
    day: number;
    label: string;
    description: string | null;
}

export default function SettingsPage() {
    const [tab, setTab] = useState<"questions" | "touchpoints" | "tips" | "milestones">("questions");
    const [questions, setQuestions] = useState<CheckInQuestion[]>([]);
    const [touchpoints, setTouchpoints] = useState<BuddyTouchpoint[]>([]);
    const [tips, setTips] = useState<BuddyTip[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);

    // Add question form
    const [showAddQ, setShowAddQ] = useState(false);
    const [newQDay, setNewQDay] = useState(7);
    const [newQText, setNewQText] = useState("");

    // Edit question
    const [editingQId, setEditingQId] = useState<string | null>(null);
    const [editQText, setEditQText] = useState("");

    // Add touchpoint form
    const [showAddTP, setShowAddTP] = useState(false);
    const [newTPDay, setNewTPDay] = useState(1);
    const [newTPLabel, setNewTPLabel] = useState("");
    const [newTPDesc, setNewTPDesc] = useState("");

    // Edit touchpoint
    const [editingTPId, setEditingTPId] = useState<string | null>(null);
    const [editTPDay, setEditTPDay] = useState(1);
    const [editTPLabel, setEditTPLabel] = useState("");
    const [editTPDesc, setEditTPDesc] = useState("");

    useEffect(() => {
        Promise.all([
            fetch("/api/settings/checkin-questions").then((r) => r.json()),
            fetch("/api/settings/buddy-touchpoints").then((r) => r.json()),
            fetch("/api/settings/buddy-tips").then((r) => r.json()),
            fetch("/api/settings/milestones").then((r) => r.json()),
        ]).then(([qData, tpData, tipsData, mData]) => {
            setQuestions(qData.questions || []);
            setTouchpoints(tpData.touchpoints || []);
            setTips(tipsData.tips || []);
            setMilestones(mData.milestones || []);
            setLoading(false);
        });
    }, []);

    // Ensure we have a valid default for newQDay if milestones exist
    useEffect(() => {
        if (milestones.length > 0 && !milestones.find(m => m.day === newQDay)) {
            setNewQDay(milestones[0].day);
        }
    }, [milestones, newQDay]);

    // --- Check-in Questions CRUD ---
    const addQuestion = async () => {
        const res = await fetch("/api/settings/checkin-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduledDay: newQDay, question: newQText }),
        });
        if (res.ok) {
            const data = await res.json();
            setQuestions([...questions, data.question]);
            setNewQText("");
            setShowAddQ(false);
        }
    };

    const updateQuestion = async (id: string) => {
        const res = await fetch(`/api/settings/checkin-questions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: editQText }),
        });
        if (res.ok) {
            setQuestions(questions.map((q) => (q.id === id ? { ...q, question: editQText } : q)));
            setEditingQId(null);
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm("Delete this question?")) return;
        await fetch(`/api/settings/checkin-questions/${id}`, { method: "DELETE" });
        setQuestions(questions.filter((q) => q.id !== id));
    };

    // --- Buddy Touchpoints CRUD ---
    const addTouchpoint = async () => {
        const res = await fetch("/api/settings/buddy-touchpoints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day: newTPDay, label: newTPLabel, description: newTPDesc }),
        });
        if (res.ok) {
            const data = await res.json();
            setTouchpoints([...touchpoints, data.touchpoint].sort((a, b) => a.day - b.day));
            setNewTPDay(1);
            setNewTPLabel("");
            setNewTPDesc("");
            setShowAddTP(false);
        }
    };

    const updateTouchpoint = async (id: string) => {
        const res = await fetch(`/api/settings/buddy-touchpoints/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day: editTPDay, label: editTPLabel, description: editTPDesc }),
        });
        if (res.ok) {
            setTouchpoints(
                touchpoints.map((tp) => (tp.id === id ? { ...tp, day: editTPDay, label: editTPLabel, description: editTPDesc } : tp)).sort((a, b) => a.day - b.day)
            );
            setEditingTPId(null);
        }
    };

    const deleteTouchpoint = async (id: string) => {
        if (!confirm("Delete this touchpoint?")) return;
        await fetch(`/api/settings/buddy-touchpoints/${id}`, { method: "DELETE" });
        setTouchpoints(touchpoints.filter((tp) => tp.id !== id));
    };

    // Group questions by day
    const questionsByDay: Record<number, CheckInQuestion[]> = {};
    questions.forEach((q) => {
        if (!questionsByDay[q.scheduledDay]) questionsByDay[q.scheduledDay] = [];
        questionsByDay[q.scheduledDay].push(q);
    });

    const sortedMilestones = [...milestones].sort((a, b) => a.day - b.day);

    if (loading) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">Settings ⚙️</h1></div>
                <div className="page-body"><div className="skeleton" style={{ height: "300px" }} /></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Settings ⚙️</h1>
                <p className="page-subtitle">Manage check-in questions, touchpoints, and milestones</p>
            </div>

            <div className="page-body">
                {/* Tabs */}
                <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-gray-100)" }}>
                    {[
                        { key: "milestones" as const, label: "Milestones", icon: "📍", count: milestones.length },
                        { key: "questions" as const, label: "Check-in Questions", icon: "💬", count: questions.length },
                        { key: "touchpoints" as const, label: "Touchpoints", icon: "🤝", count: touchpoints.length },
                        { key: "tips" as const, label: "Buddy Tips", icon: "💡", count: tips.length },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: "0.75rem 1.25rem", background: "none", border: "none",
                                borderBottom: tab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                                marginBottom: "-2px", cursor: "pointer", fontSize: "0.85rem",
                                fontWeight: tab === t.key ? 600 : 400,
                                color: tab === t.key ? "var(--color-primary)" : "var(--color-gray-500)",
                                display: "flex", alignItems: "center", gap: "0.5rem",
                            }}
                        >
                            {t.icon} {t.label}
                            <span className={`badge ${tab === t.key ? "badge-primary" : "badge-neutral"}`} style={{ fontSize: "0.65rem" }}>{t.count}</span>
                        </button>
                    ))}
                </div>

                {/* ===== CHECK-IN QUESTIONS TAB ===== */}
                {tab === "questions" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                                These questions are shown to new hires at each check-in milestone.
                            </p>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddQ(true)}>+ Add Question</button>
                        </div>

                        {showAddQ && (
                            <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
                                <div style={{ display: "flex", gap: "0.75rem", alignItems: "end" }}>
                                    <div className="form-group" style={{ flex: 0, minWidth: "150px" }}>
                                        <label className="label">Milestone</label>
                                        <select className="select" value={newQDay} onChange={(e) => setNewQDay(parseInt(e.target.value))}>
                                            {sortedMilestones.map((m) => (
                                                <option key={m.id} value={m.day}>{m.label} (Day {m.day})</option>
                                            ))}
                                            {sortedMilestones.length === 0 && <option value={7}>Day 7</option>}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="label">Question</label>
                                        <input className="input" value={newQText} onChange={(e) => setNewQText(e.target.value)} placeholder="e.g. How supported do you feel?" />
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={addQuestion} disabled={!newQText}>Add</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddQ(false)}>✕</button>
                                </div>
                            </div>
                        )}

                        {Array.from(new Set([
                            ...milestones.map(m => m.day),
                            ...questions.map(q => q.scheduledDay)
                        ])).sort((a, b) => a - b).map((day) => {
                            const milestone = milestones.find(m => m.day === day);
                            const label = milestone ? milestone.label : `Day ${day}`;
                            const qs = questionsByDay[day] || [];

                            return (
                                <div key={day} style={{ marginBottom: "1.5rem" }}>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.5rem" }}>
                                        {label} {milestone ? <span style={{ fontWeight: 400, color: "var(--color-gray-400)" }}>(Day {day})</span> : null}
                                        <span className="badge badge-neutral" style={{ fontSize: "0.65rem", marginLeft: "0.5rem" }}>
                                            {qs.length} questions
                                        </span>
                                    </h3>
                                    {qs.length === 0 ? (
                                        <div style={{ padding: "0.75rem", fontSize: "0.8rem", color: "var(--color-gray-400)", fontStyle: "italic" }}>
                                            No questions — click &quot;+ Add Question&quot; above
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                            {qs.map((q) => (
                                                <div key={q.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    {editingQId === q.id ? (
                                                        <>
                                                            <input className="input" value={editQText} onChange={(e) => setEditQText(e.target.value)} style={{ flex: 1 }} />
                                                            <button className="btn btn-primary btn-sm" onClick={() => updateQuestion(q.id)}>Save</button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingQId(null)}>✕</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ fontSize: "0.85rem", flex: 1 }}>{q.question}</span>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingQId(q.id); setEditQText(q.question); }} title="Edit">✏️</button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteQuestion(q.id)} title="Delete" style={{ color: "var(--color-danger)" }}>🗑️</button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                {/* ===== BUDDY TOUCHPOINTS TAB ===== */}
                {tab === "touchpoints" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                                Suggested activities between the new hire and their buddy.
                            </p>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddTP(true)}>+ Add Touchpoint</button>
                        </div>

                        {showAddTP && (
                            <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: "0.75rem", alignItems: "end" }}>
                                    <div className="form-group">
                                        <label className="label">Day</label>
                                        <input className="input" type="number" min={1} max={90} value={newTPDay} onChange={(e) => setNewTPDay(parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Activity</label>
                                        <input className="input" value={newTPLabel} onChange={(e) => setNewTPLabel(e.target.value)} placeholder="e.g. Team lunch" />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Description</label>
                                        <input className="input" value={newTPDesc} onChange={(e) => setNewTPDesc(e.target.value)} placeholder="Optional details" />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                    <button className="btn btn-primary btn-sm" onClick={addTouchpoint} disabled={!newTPLabel}>Add</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTP(false)}>Cancel</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {touchpoints.map((tp) => (
                                <div key={tp.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    {editingTPId === tp.id ? (
                                        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "60px 1fr 1fr auto auto", gap: "0.5rem", alignItems: "center" }}>
                                            <input className="input" type="number" min={1} max={90} value={editTPDay} onChange={(e) => setEditTPDay(parseInt(e.target.value) || 1)} style={{ padding: "0.4rem" }} />
                                            <input className="input" value={editTPLabel} onChange={(e) => setEditTPLabel(e.target.value)} style={{ padding: "0.4rem" }} />
                                            <input className="input" value={editTPDesc} onChange={(e) => setEditTPDesc(e.target.value)} placeholder="Description" style={{ padding: "0.4rem" }} />
                                            <button className="btn btn-primary btn-sm" onClick={() => updateTouchpoint(tp.id)}>Save</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingTPId(null)}>✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="badge badge-neutral" style={{ minWidth: "45px", textAlign: "center" }}>Day {tp.day}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{tp.label}</div>
                                                {tp.description && <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{tp.description}</div>}
                                            </div>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTPId(tp.id); setEditTPDay(tp.day); setEditTPLabel(tp.label); setEditTPDesc(tp.description || ""); }} title="Edit">✏️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteTouchpoint(tp.id)} title="Delete" style={{ color: "var(--color-danger)" }}>🗑️</button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ===== BUDDY TIPS TAB ===== */}
                {tab === "tips" && (
                    <BuddyTipsSettings initialTips={tips} onTipsUpdate={setTips} />
                )}

                {/* ===== MILESTONES TAB ===== */}
                {tab === "milestones" && (
                    <MilestonesSettings milestones={milestones} onMilestonesUpdate={setMilestones} />
                )}
            </div>
        </>
    );
}

function BuddyTipsSettings({ initialTips, onTipsUpdate }: { initialTips: BuddyTip[], onTipsUpdate: (tips: BuddyTip[]) => void }) {
    const [tips, setTips] = useState<BuddyTip[]>(initialTips);
    const [newTip, setNewTip] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    // Sync local state if parent prop changes (though usually handled by parent fetch)
    useEffect(() => { setTips(initialTips); }, [initialTips]);

    const addTip = async () => {
        if (!newTip.trim()) return;
        const res = await fetch("/api/settings/buddy-tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tip: newTip }),
        });
        if (res.ok) {
            const data = await res.json();
            const updated = [...tips, data.tip];
            setTips(updated);
            onTipsUpdate(updated);
            setNewTip("");
        }
    };

    const updateTip = async (id: string) => {
        const res = await fetch(`/api/settings/buddy-tips/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tip: editText }),
        });
        if (res.ok) {
            const updated = tips.map((t) => (t.id === id ? { ...t, tip: editText } : t));
            setTips(updated);
            onTipsUpdate(updated);
            setEditingId(null);
        }
    };

    const deleteTip = async (id: string) => {
        if (!confirm("Delete this tip?")) return;
        await fetch(`/api/settings/buddy-tips/${id}`, { method: "DELETE" });
        const updated = tips.filter((t) => t.id !== id);
        setTips(updated);
        onTipsUpdate(updated);
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                    Tips shown to buddies on the &quot;My Buddy&quot; page.
                </p>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem", display: "flex", gap: "0.5rem" }}>
                <input
                    className="input"
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder="Add a new tip (e.g. 'Share unwritten rules')"
                    style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={addTip} disabled={!newTip.trim()}>Add</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {tips.map((t) => (
                    <div key={t.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {editingId === t.id ? (
                            <>
                                <input
                                    className="input"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button className="btn btn-primary btn-sm" onClick={() => updateTip(t.id)}>Save</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: "0.85rem", flex: 1 }}>{t.tip}</span>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(t.id); setEditText(t.tip); }} title="Edit">✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => deleteTip(t.id)} title="Delete" style={{ color: "var(--color-danger)" }}>🗑️</button>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {tips.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">💡</div>
                    <div className="empty-state-title">No tips configured</div>
                    <div className="empty-state-desc">Add tips to help your buddies support new hires effectively.</div>
                </div>
            )}
        </>
    );
}

function MilestonesSettings({ milestones, onMilestonesUpdate }: { milestones: Milestone[], onMilestonesUpdate: (m: Milestone[]) => void }) {
    // Local state to manage immediate updates, though prop updates populate it too
    const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
    const [newDay, setNewDay] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editDesc, setEditDesc] = useState("");

    useEffect(() => { setLocalMilestones(milestones); }, [milestones]);

    const addMilestone = async () => {
        if (!newDay || !newLabel) return;
        const res = await fetch("/api/settings/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day: parseInt(newDay), label: newLabel, description: newDesc }),
        });
        if (res.ok) {
            const data = await res.json();
            const updated = [...localMilestones, data.milestone].sort((a, b) => a.day - b.day);
            setLocalMilestones(updated);
            onMilestonesUpdate(updated);
            setNewDay("");
            setNewLabel("");
            setNewDesc("");
        } else {
            alert("Failed to add milestone. Ensure day is unique.");
        }
    };

    const updateMilestone = async (id: string) => {
        const res = await fetch(`/api/settings/milestones/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: editLabel, description: editDesc }),
        });
        if (res.ok) {
            const updated = localMilestones.map((m) => (m.id === id ? { ...m, label: editLabel, description: editDesc } : m));
            setLocalMilestones(updated);
            onMilestonesUpdate(updated);
            setEditingId(null);
        }
    };

    const deleteMilestone = async (id: string) => {
        if (!confirm("Delete this milestone? It may affect existing check-ins.")) return;
        await fetch(`/api/settings/milestones/${id}`, { method: "DELETE" });
        const updated = localMilestones.filter((m) => m.id !== id);
        setLocalMilestones(updated);
        onMilestonesUpdate(updated);
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                    Define the key days for check-ins and progress tracking (e.g. Day 7, Day 30).
                </p>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
                    <div className="form-group">
                        <label className="label">Day</label>
                        <input className="input" type="number" min={1} max={365} value={newDay} onChange={(e) => setNewDay(e.target.value)} placeholder="Wait..." />
                    </div>
                    <div className="form-group">
                        <label className="label">Label</label>
                        <input className="input" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. First Week" />
                    </div>
                    <div className="form-group">
                        <label className="label">Description</label>
                        <input className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={addMilestone} disabled={!newDay || !newLabel} style={{ height: "38px" }}>Add</button>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {localMilestones.map((m) => (
                    <div key={m.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {editingId === m.id ? (
                            <>
                                <span className="badge badge-neutral" style={{ minWidth: "60px", textAlign: "center" }}>Day {m.day}</span>
                                <input className="input" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={{ flex: 1 }} />
                                <input className="input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ flex: 1 }} placeholder="Description" />
                                <button className="btn btn-primary btn-sm" onClick={() => updateMilestone(m.id)}>Save</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                            </>
                        ) : (
                            <>
                                <span className="badge badge-neutral" style={{ minWidth: "60px", textAlign: "center" }}>Day {m.day}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.label}</div>
                                    {m.description && <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{m.description}</div>}
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(m.id); setEditLabel(m.label); setEditDesc(m.description || ""); }} title="Edit">✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => deleteMilestone(m.id)} title="Delete" style={{ color: "var(--color-danger)" }}>🗑️</button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
