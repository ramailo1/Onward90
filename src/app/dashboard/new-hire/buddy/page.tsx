"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface BuddyInfo {
    name: string;
    email: string;
    department: string | null;
}

interface Touchpoint {
    id: string;
    day: number;
    label: string;
    description: string | null;
}

interface OnboardingData {
    startDate: string;
    buddy: BuddyInfo | null;
}

export default function BuddyPage() {
    const { data: session } = useSession();
    const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
    const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
    const [tips, setTips] = useState<{ id: string; tip: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDay, setCurrentDay] = useState(1);

    useEffect(() => {
        Promise.all([
            fetch("/api/onboarding/mine").then((r) => r.json()),
            fetch("/api/settings/buddy-touchpoints").then((r) => r.json()),
            fetch("/api/settings/buddy-tips").then((r) => r.json()),
        ]).then(([obData, tpData, tipsData]) => {
            const ob = obData.onboarding;
            setOnboarding(ob || null);
            setTouchpoints(tpData.touchpoints || []);
            setTips(tipsData.tips || []);

            if (ob) {
                const startDate = new Date(ob.startDate);
                const dayNum = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                setCurrentDay(dayNum);
            }

            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">My Buddy 🤝</h1></div>
                <div className="page-body">
                    <div className="skeleton" style={{ height: "200px", marginBottom: "1rem" }} />
                    <div className="skeleton" style={{ height: "300px" }} />
                </div>
            </>
        );
    }

    if (!onboarding) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">My Buddy 🤝</h1></div>
                <div className="page-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">🤝</div>
                        <div className="empty-state-title">No buddy assigned yet</div>
                        <div className="empty-state-desc">Your manager will assign you an onboarding buddy soon!</div>
                    </div>
                </div>
            </>
        );
    }

    const buddy = onboarding.buddy;
    const buddyInitials = buddy?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?";

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">My Buddy 🤝</h1>
                <p className="page-subtitle">Your onboarding buddy is here to help you navigate your first 90 days</p>
            </div>

            <div className="page-body" style={{ maxWidth: "640px" }}>
                {buddy ? (
                    <>
                        {/* Buddy Card */}
                        <div className="card" style={{ textAlign: "center", padding: "2rem", marginBottom: "2rem" }}>
                            <div className="avatar avatar-xl" style={{ margin: "0 auto 1rem" }}>
                                {buddyInitials}
                            </div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                                {buddy.name}
                            </h2>
                            <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1rem" }}>
                                {buddy.department || "Team member"} · {buddy.email}
                            </p>
                            <div className="alert alert-info" style={{ textAlign: "left" }}>
                                <span>💡</span>
                                <div>
                                    <strong>How your buddy helps:</strong>
                                    {tips.length > 0 ? (
                                        <ul style={{ marginTop: "0.25rem", paddingLeft: "1rem", fontSize: "0.85rem", lineHeight: "1.8" }}>
                                            {tips.map((t) => (
                                                <li key={t.id}>{t.tip}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                                            Your buddy is here to guide and support you!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Suggested Touchpoints - from DB */}
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
                            Suggested Touchpoints
                        </h3>
                        {touchpoints.length > 0 ? (
                            <div className="timeline">
                                {touchpoints.map((tp) => (
                                    <div key={tp.id} className="timeline-item">
                                        <div className={`timeline-marker ${currentDay >= tp.day ? "completed" : ""}`} />
                                        <div className="task-card" style={{ opacity: currentDay >= tp.day ? 0.7 : 1 }}>
                                            <div className="task-card-body">
                                                <div className="task-card-title">
                                                    {currentDay >= tp.day ? "✓ " : ""}{tp.label}
                                                </div>
                                                {tp.description && (
                                                    <div className="task-card-desc">{tp.description}</div>
                                                )}
                                                <div className="task-card-meta">
                                                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
                                                        Day {tp.day}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📋</div>
                                <div className="empty-state-title">No touchpoints yet</div>
                                <div className="empty-state-desc">Your HR admin will set up suggested activities for you and your buddy.</div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🤝</div>
                        <div className="empty-state-title">No buddy assigned yet</div>
                        <div className="empty-state-desc">Your manager will assign you an onboarding buddy soon!</div>
                    </div>
                )}
            </div>
        </>
    );
}
