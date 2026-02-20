"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Template {
    id: string;
    name: string;
    department: string | null;
    roleTarget: string | null;
    isActive: boolean;
    _count: { tasks: number; onboardings: number };
}

interface TaskForm {
    id?: string; // Optional ID for editing
    title: string;
    description: string;
    taskType: string;
    dayNumber: number;
    requiresApproval: boolean;
}

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false); // Track if we are editing

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        action: () => void;
    }>({ title: "", description: "", action: () => { } });

    // Create form
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [roleTarget, setRoleTarget] = useState("");

    // Task form
    const [taskForm, setTaskForm] = useState<TaskForm>({
        title: "",
        description: "",
        taskType: "DO_SUBMIT",
        dayNumber: 1,
        requiresApproval: false,
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const res = await fetch("/api/templates");
        const data = await res.json();
        setTemplates(data.templates || []);
        setLoading(false);
    };

    const createTemplate = async () => {
        const res = await fetch("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, department, roleTarget }),
        });
        if (res.ok) {
            setShowCreate(false);
            setName("");
            setDepartment("");
            setRoleTarget("");
            fetchTemplates();
        } else {
            const data = await res.json();
            alert(data.error || "Failed to create template");
        }
    };

    const loadTasks = async (templateId: string) => {
        const res = await fetch(`/api/templates/${templateId}/tasks`);
        const data = await res.json();
        setTasks(data.tasks || []);
        setEditingId(templateId);
    };

    const openEditTask = (task: any) => {
        setTaskForm({
            id: task.id,
            title: task.title,
            description: task.description || "",
            taskType: task.taskType,
            dayNumber: task.dayNumber,
            requiresApproval: task.requiresApproval,
        });
        setIsEditingTask(true);
        setShowAddTask(true);
    };

    const saveTask = async () => {
        if (!editingId) return;

        const url = isEditingTask && taskForm.id
            ? `/api/templates/${editingId}/tasks/${taskForm.id}`
            : `/api/templates/${editingId}/tasks`;

        const method = isEditingTask ? "PATCH" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...taskForm,
                weekNumber: Math.ceil(taskForm.dayNumber / 7),
            }),
        });

        if (res.ok) {
            resetTaskForm();
            loadTasks(editingId);
        } else {
            alert("Failed to save task");
        }
    };

    const resetTaskForm = () => {
        setTaskForm({ title: "", description: "", taskType: "DO_SUBMIT", dayNumber: 1, requiresApproval: false });
        setShowAddTask(false);
        setIsEditingTask(false);
    };

    const confirmDeleteTask = (taskId: string) => {
        setConfirmConfig({
            title: "Delete Task?",
            description: "Are you sure you want to delete this task? This cannot be undone.",
            action: () => deleteTask(taskId),
        });
        setConfirmOpen(true);
    };

    const deleteTask = async (taskId: string) => {
        if (!editingId) return;
        await fetch(`/api/templates/${editingId}/tasks/${taskId}`, { method: "DELETE" });
        setConfirmOpen(false);
        loadTasks(editingId);
    };

    const confirmDeleteTemplate = (templateId: string, templateName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmConfig({
            title: `Delete "${templateName}"?`,
            description: "This will permanently remove the template and all its tasks. Templates currently in use by active onboardings cannot be deleted.",
            action: () => deleteTemplate(templateId),
        });
        setConfirmOpen(true);
    };

    const deleteTemplate = async (templateId: string) => {
        const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
        setConfirmOpen(false);
        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Failed to delete template");
            return;
        }
        fetchTemplates();
    };

    const taskTypeLabels: Record<string, { icon: string; label: string }> = {
        READ: { icon: "📖", label: "Read/Watch" },
        MEETING: { icon: "📅", label: "Meeting" },
        DO_SUBMIT: { icon: "✅", label: "Do/Submit" },
        ACKNOWLEDGE: { icon: "📋", label: "Acknowledge" },
    };

    if (loading) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">Templates 📋</h1></div>
                <div className="page-body">
                    <div className="skeleton" style={{ height: "200px" }} />
                </div>
            </>
        );
    }

    // Editing a template's tasks
    if (editingId) {
        const template = templates.find((t) => t.id === editingId);
        return (
            <>
                <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="page-title">{template?.name || "Template"}</h1>
                        <p className="page-subtitle">{template?.department} · {template?.roleTarget} · {tasks.length} tasks</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                            ← Back
                        </button>
                        <button className="btn btn-primary" onClick={() => { resetTaskForm(); setShowAddTask(true); }}>
                            + Add Task
                        </button>
                    </div>
                </div>
                <div className="page-body">
                    {showAddTask && (
                        <div className="card animate-fade-in" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>{isEditingTask ? "Edit Task" : "Add New Task"}</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="label">Title</label>
                                    <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Day Number (1-90)</label>
                                    <input className="input" type="number" min={1} max={90} value={taskForm.dayNumber} onChange={(e) => setTaskForm({ ...taskForm, dayNumber: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Type</label>
                                    <select className="select" value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}>
                                        {Object.entries(taskTypeLabels).map(([key, val]) => (
                                            <option key={key} value={key}>{val.icon} {val.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Requires Approval</label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                                        <input type="checkbox" checked={taskForm.requiresApproval} onChange={(e) => setTaskForm({ ...taskForm, requiresApproval: e.target.checked })} />
                                        Manager must approve completion
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Description</label>
                                <textarea className="textarea" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="What should the new hire do?" rows={2} />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn btn-secondary" onClick={resetTaskForm}>Cancel</button>
                                <button className="btn btn-primary" onClick={saveTask} disabled={!taskForm.title}>
                                    {isEditingTask ? "Save Changes" : "Add Task"}
                                </button>
                            </div>
                        </div>
                    )}

                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <div className="empty-state-title">No tasks yet</div>
                            <div className="empty-state-desc">Add tasks to build your onboarding plan.</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {tasks.map((task: any) => (
                                <div key={task.id} className="task-card">
                                    <div className={`task-card-icon ${taskTypeLabels[task.taskType]?.icon === "📖" ? "read" : task.taskType === "MEETING" ? "meeting" : task.taskType === "ACKNOWLEDGE" ? "acknowledge" : "do"}`}>
                                        {taskTypeLabels[task.taskType]?.icon || "✅"}
                                    </div>
                                    <div className="task-card-body">
                                        <div className="task-card-title">{task.title}</div>
                                        <div className="task-card-desc">{task.description}</div>
                                        <div className="task-card-meta">
                                            <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>Day {task.dayNumber}</span>
                                            <span className="badge badge-neutral">{taskTypeLabels[task.taskType]?.label}</span>
                                            {task.requiresApproval && <span className="badge badge-info">Approval needed</span>}
                                        </div>
                                    </div>
                                    <div className="task-card-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTask(task)} title="Edit task">✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => confirmDeleteTask(task.id)} title="Delete task" style={{ color: "var(--color-danger)" }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
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

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="page-title">Templates 📋</h1>
                    <p className="page-subtitle">Create and manage onboarding plan templates</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    + New Template
                </button>
            </div>

            <div className="page-body">
                {showCreate && (
                    <div className="card animate-fade-in" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Create Template</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="label">Name</label>
                                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering Onboarding" />
                            </div>
                            <div className="form-group">
                                <label className="label">Department</label>
                                <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
                            </div>
                            <div className="form-group">
                                <label className="label">Role Target</label>
                                <input className="input" value={roleTarget} onChange={(e) => setRoleTarget(e.target.value)} placeholder="e.g. Software Engineer" />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createTemplate} disabled={!name}>Create</button>
                        </div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {templates.map((tpl) => (
                        <div key={tpl.id} className="card" style={{ cursor: "pointer", position: "relative" }} onClick={() => loadTasks(tpl.id)}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{tpl.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                                        {tpl.department} · {tpl.roleTarget}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    <span className={`badge ${tpl.isActive ? "badge-success" : "badge-neutral"}`}>
                                        {tpl.isActive ? "Active" : "Draft"}
                                    </span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => confirmDeleteTemplate(tpl.id, tpl.name, e)}
                                        title="Delete template"
                                        style={{ color: "var(--color-danger)", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <span className="badge badge-neutral">{tpl._count.tasks} tasks</span>
                                <span className="badge badge-info">{tpl._count.onboardings} onboardings</span>
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-primary)", marginTop: "0.75rem", fontWeight: 500 }}>
                                Click to view & edit tasks →
                            </div>
                        </div>
                    ))}
                </div>
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
