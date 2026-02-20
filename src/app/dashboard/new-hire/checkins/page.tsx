"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CheckIn {
    id: string;
    scheduledDay: number;
    status: string;
    submittedAt: string | null;
    responses: {
        id: string;
        question: string;
        rating: number | null;
        answer: string | null;
        visibility: string;
    }[];
}

interface DBQuestion {
    id: string;
    scheduledDay: number;
    question: string;
    sortOrder: number;
}

export default function CheckInsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [dbQuestions, setDbQuestions] = useState<DBQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);
    const [responses, setResponses] = useState<Record<string, { rating: number; answer: string; visibility: string }>>({});
    const [submitting, setSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch("/api/checkins").then((res) => res.json()),
            fetch("/api/settings/checkin-questions").then((res) => res.json()),
        ]).then(([checkInData, qData]) => {
            setCheckIns(checkInData.checkIns || []);
            setDbQuestions(qData.questions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Get questions for a given day from DB data
    const getQuestionsForDay = (day: number): string[] => {
        return dbQuestions
            .filter((q) => q.scheduledDay === day)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((q) => q.question);
    };

    const startCheckIn = (checkIn: CheckIn) => {
        setActiveCheckIn(checkIn);
        setIsEditing(false);
        const questions = getQuestionsForDay(checkIn.scheduledDay);
        const initial: Record<string, { rating: number; answer: string; visibility: string }> = {};
        questions.forEach((q) => {
            initial[q] = { rating: 0, answer: "", visibility: "MANAGER_HR" };
        });
        setResponses(initial);
    };

    const editCheckIn = (checkIn: CheckIn) => {
        setActiveCheckIn(checkIn);
        setIsEditing(true);
        const initial: Record<string, { rating: number; answer: string; visibility: string }> = {};
        const questions = getQuestionsForDay(checkIn.scheduledDay);
        questions.forEach((q) => {
            const existing = checkIn.responses.find((r) => r.question === q);
            initial[q] = {
                rating: existing?.rating || 0,
                answer: existing?.answer || "",
                visibility: existing?.visibility || "MANAGER_HR",
            };
        });
        setResponses(initial);
    };

    const submitCheckIn = async () => {
        if (!activeCheckIn) return;
        setSubmitting(true);

        const responseArray = Object.entries(responses).map(([question, data]) => ({
            question,
            rating: data.rating,
            answer: data.answer,
            visibility: data.visibility,
        }));

        try {
            const endpoint = isEditing ? "/api/checkins/edit" : "/api/checkins/submit";
            const method = isEditing ? "PATCH" : "POST";
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    checkInId: activeCheckIn.id,
                    responses: responseArray,
                }),
            });

            if (res.ok) {
                setActiveCheckIn(null);
                setIsEditing(false);
                router.refresh();
                const data = await fetch("/api/checkins").then((r) => r.json());
                setCheckIns(data.checkIns || []);
            }
        } catch (error) {
            console.error("Submit error:", error);
        }

        setSubmitting(false);
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Check-ins 💬</h1>
                </div>
                <div className="page-body">
                    <div className="skeleton" style={{ height: "200px", marginBottom: "1rem" }} />
                    <div className="skeleton" style={{ height: "200px" }} />
                </div>
            </>
        );
    }

    // Active check-in form
    if (activeCheckIn) {
        const questions = getQuestionsForDay(activeCheckIn.scheduledDay);

        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Day {activeCheckIn.scheduledDay} Check-in 💬</h1>
                    <p className="page-subtitle">
                        Take a few minutes to reflect on your onboarding experience
                    </p>
                </div>
                <div className="page-body" style={{ maxWidth: "640px" }}>
                    {questions.map((question, idx) => (
                        <div key={idx} className="card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
                            <div className="label" style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                                {idx + 1}. {question}
                            </div>

                            {/* Rating */}
                            <div style={{ marginBottom: "0.75rem" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
                                    Rating (1 = needs improvement, 5 = excellent)
                                </div>
                                <div className="rating-input">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`rating-star ${(responses[question]?.rating || 0) >= star ? "filled" : ""
                                                }`}
                                            onClick={() =>
                                                setResponses((prev) => ({
                                                    ...prev,
                                                    [question]: { ...prev[question], rating: star },
                                                }))
                                            }
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text answer */}
                            <div style={{ marginBottom: "0.75rem" }}>
                                <textarea
                                    className="textarea"
                                    placeholder="Optional: Add any details or context..."
                                    value={responses[question]?.answer || ""}
                                    onChange={(e) =>
                                        setResponses((prev) => ({
                                            ...prev,
                                            [question]: { ...prev[question], answer: e.target.value },
                                        }))
                                    }
                                    rows={2}
                                />
                            </div>

                            {/* Visibility */}
                            <div className="visibility-toggle">
                                <button
                                    type="button"
                                    className={`visibility-option ${responses[question]?.visibility === "MANAGER_HR" ? "selected" : ""
                                        }`}
                                    onClick={() =>
                                        setResponses((prev) => ({
                                            ...prev,
                                            [question]: { ...prev[question], visibility: "MANAGER_HR" },
                                        }))
                                    }
                                >
                                    👤 Manager + HR
                                </button>
                                <button
                                    type="button"
                                    className={`visibility-option ${responses[question]?.visibility === "HR_ONLY" ? "selected" : ""
                                        }`}
                                    onClick={() =>
                                        setResponses((prev) => ({
                                            ...prev,
                                            [question]: { ...prev[question], visibility: "HR_ONLY" },
                                        }))
                                    }
                                >
                                    🏢 HR Only
                                </button>
                            </div>
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setActiveCheckIn(null)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={submitCheckIn}
                            disabled={submitting || Object.values(responses).some((r) => r.rating === 0)}
                            style={{ flex: 1 }}
                        >
                            {submitting ? "Submitting..." : "Submit Check-in"}
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Check-ins 💬</h1>
                <p className="page-subtitle">
                    Scheduled wellness check-ins at key milestones in your journey
                </p>
            </div>
            <div className="page-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {checkIns.map((ci) => {
                        const dayLabels: Record<number, string> = {
                            7: "First Week Reflection",
                            30: "One Month Check-in",
                            60: "Two Month Review",
                            90: "Final Assessment",
                        };

                        return (
                            <div key={ci.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "var(--radius-full)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.25rem",
                                        flexShrink: 0,
                                        background:
                                            ci.status === "SUBMITTED"
                                                ? "var(--color-success-light)"
                                                : ci.status === "PENDING"
                                                    ? "var(--color-warning-light)"
                                                    : "var(--color-gray-100)",
                                    }}
                                >
                                    {ci.status === "SUBMITTED" ? "✓" : ci.status === "REVIEWED" ? "👁️" : "💬"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                                        Day {ci.scheduledDay} — {dayLabels[ci.scheduledDay] || "Check-in"}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
                                        {ci.status === "SUBMITTED" && ci.submittedAt
                                            ? `Submitted ${new Date(ci.submittedAt).toLocaleDateString()}`
                                            : ci.status === "PENDING"
                                                ? "Ready to complete"
                                                : "Reviewed by your manager"}
                                    </div>
                                    {ci.status === "SUBMITTED" && ci.responses.length > 0 && (
                                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                            {ci.responses.map((r) => (
                                                <span key={r.id} className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>
                                                    {"★".repeat(r.rating || 0)}{"☆".repeat(5 - (r.rating || 0))}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    {ci.status === "PENDING" ? (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => startCheckIn(ci)}
                                        >
                                            Start →
                                        </button>
                                    ) : (
                                        <>
                                            <span className={`badge ${ci.status === "SUBMITTED" ? "badge-success" : "badge-info"}`}>
                                                {ci.status === "SUBMITTED" ? "Completed" : "Reviewed"}
                                            </span>
                                            {ci.status === "SUBMITTED" && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => editCheckIn(ci)}
                                                    title="Edit your responses"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
