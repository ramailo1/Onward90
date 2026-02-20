"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setLoading(false);
                return;
            }

            // Fetch session to get role for redirect
            const res = await fetch("/api/auth/session");
            const session = await res.json();
            const role = session?.user?.role;

            if (role === "HR_ADMIN") {
                router.push("/dashboard/admin");
            } else if (role === "MANAGER") {
                router.push("/dashboard/manager");
            } else {
                router.push("/dashboard/new-hire");
            }
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const quickLogin = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword("demo1234");
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Left panel - Branding */}
                <div style={styles.leftPanel}>
                    <div style={styles.brandContent}>
                        <div style={styles.logoMark}>90</div>
                        <h1 style={styles.brandTitle}>First 90 Days</h1>
                        <p style={styles.brandSubtitle}>Onboarding Companion</p>
                        <div style={styles.brandDivider}></div>
                        <p style={styles.brandDesc}>
                            Companies with structured onboarding see{" "}
                            <strong>82% better retention</strong> and{" "}
                            <strong>70% higher productivity</strong>.
                        </p>
                        <div style={styles.brandStats}>
                            <div style={styles.brandStat}>
                                <span style={styles.brandStatNum}>90</span>
                                <span style={styles.brandStatLabel}>Days of guided support</span>
                            </div>
                            <div style={styles.brandStat}>
                                <span style={styles.brandStatNum}>4</span>
                                <span style={styles.brandStatLabel}>Scheduled check-ins</span>
                            </div>
                            <div style={styles.brandStat}>
                                <span style={styles.brandStatNum}>∞</span>
                                <span style={styles.brandStatLabel}>Growth potential</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel - Login */}
                <div style={styles.rightPanel}>
                    <div style={styles.formContainer}>
                        <h2 style={styles.formTitle}>Welcome back</h2>
                        <p style={styles.formSubtitle}>
                            Sign in to continue your onboarding journey
                        </p>

                        {error && (
                            <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label" htmlFor="email">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    className="input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: "100%", marginTop: "var(--space-2)" }}
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        {/* Demo accounts */}
                        <div style={styles.demoSection}>
                            <p style={styles.demoLabel}>Quick demo login:</p>
                            <div style={styles.demoButtons}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => quickLogin("hr@demo.com")}
                                >
                                    🏢 HR Admin
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => quickLogin("manager@demo.com")}
                                >
                                    👤 Manager
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => quickLogin("newhire@demo.com")}
                                >
                                    🌱 New Hire
                                </button>
                            </div>
                        </div>
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
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)",
        padding: "1rem",
    },
    container: {
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        minHeight: "600px",
        borderRadius: "var(--radius-2xl)",
        overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
        background: "var(--color-white)",
    },
    leftPanel: {
        flex: "1",
        background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)",
        padding: "3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
    },
    brandContent: {
        position: "relative",
        zIndex: 1,
        color: "#ffffff",
    },
    logoMark: {
        fontSize: "4rem",
        fontWeight: "800",
        lineHeight: "1",
        marginBottom: "0.5rem",
        opacity: "0.9",
        letterSpacing: "-2px",
    },
    brandTitle: {
        fontSize: "1.75rem",
        fontWeight: "700",
        marginBottom: "0.25rem",
    },
    brandSubtitle: {
        fontSize: "0.95rem",
        opacity: "0.8",
        fontWeight: "400",
    },
    brandDivider: {
        width: "40px",
        height: "3px",
        background: "rgba(255,255,255,0.4)",
        borderRadius: "2px",
        margin: "1.5rem 0",
    },
    brandDesc: {
        fontSize: "0.875rem",
        lineHeight: "1.7",
        opacity: "0.85",
        maxWidth: "300px",
    },
    brandStats: {
        display: "flex",
        gap: "1.5rem",
        marginTop: "2rem",
    },
    brandStat: {
        display: "flex",
        flexDirection: "column" as const,
    },
    brandStatNum: {
        fontSize: "1.75rem",
        fontWeight: "700",
        lineHeight: "1.2",
    },
    brandStatLabel: {
        fontSize: "0.7rem",
        opacity: "0.7",
        maxWidth: "80px",
        lineHeight: "1.3",
    },
    rightPanel: {
        flex: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
    },
    formContainer: {
        width: "100%",
        maxWidth: "360px",
    },
    formTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "var(--color-gray-900)",
        marginBottom: "0.25rem",
    },
    formSubtitle: {
        fontSize: "0.875rem",
        color: "var(--color-gray-500)",
        marginBottom: "1.75rem",
    },
    demoSection: {
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--color-gray-200)",
    },
    demoLabel: {
        fontSize: "0.75rem",
        color: "var(--color-gray-500)",
        marginBottom: "0.75rem",
        textAlign: "center" as const,
    },
    demoButtons: {
        display: "flex",
        gap: "0.5rem",
        justifyContent: "center",
        flexWrap: "wrap" as const,
    },
};
