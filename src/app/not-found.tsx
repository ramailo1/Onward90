"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.number}>404</div>
                <div style={styles.graphic}>
                    <span style={styles.emoji}>🧭</span>
                </div>
                <h1 style={styles.title}>Looks like you wandered off the path</h1>
                <p style={styles.desc}>
                    This page doesn&apos;t exist — just like day 91 of your onboarding plan.
                    Let&apos;s get you back on track.
                </p>
                <div style={styles.actions}>
                    <Link href="/" className="btn btn-primary btn-lg">
                        🏠 Go Home
                    </Link>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => router.back()}
                    >
                        ← Go Back
                    </button>
                </div>
                <div style={styles.hint}>
                    <p>Or try one of these:</p>
                    <div style={styles.links}>
                        <Link href="/dashboard/new-hire" style={styles.link}>🌱 New Hire Dashboard</Link>
                        <Link href="/dashboard/manager" style={styles.link}>👤 Manager Dashboard</Link>
                        <Link href="/dashboard/admin" style={styles.link}>🏢 HR Command Center</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #ede9fe 100%)",
        padding: "2rem",
    },
    container: {
        textAlign: "center" as const,
        maxWidth: "500px",
    },
    number: {
        fontSize: "8rem",
        fontWeight: "900",
        lineHeight: "1",
        background: "linear-gradient(135deg, #0d9488, #6366f1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-4px",
        marginBottom: "0.5rem",
    },
    graphic: {
        marginBottom: "1.5rem",
    },
    emoji: {
        fontSize: "4rem",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: "0.75rem",
    },
    desc: {
        fontSize: "1rem",
        color: "#6b7280",
        lineHeight: "1.6",
        marginBottom: "2rem",
    },
    actions: {
        display: "flex",
        gap: "0.75rem",
        justifyContent: "center",
        marginBottom: "2.5rem",
        flexWrap: "wrap" as const,
    },
    hint: {
        fontSize: "0.8rem",
        color: "#9ca3af",
    },
    links: {
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        marginTop: "0.75rem",
        flexWrap: "wrap" as const,
    },
    link: {
        fontSize: "0.85rem",
        fontWeight: "500",
        color: "#0d9488",
        textDecoration: "none",
    },
};
