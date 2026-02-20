"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navConfig: Record<string, { section: string; items: NavItem[] }[]> = {
    HR_ADMIN: [
        {
            section: "Overview",
            items: [{ href: "/dashboard/admin", label: "Dashboard", icon: "📊" }],
        },
        {
            section: "Manage",
            items: [
                { href: "/dashboard/admin/templates", label: "Templates", icon: "📋" },
                { href: "/dashboard/admin/onboardings", label: "Onboardings", icon: "🚀" },
                { href: "/dashboard/admin/people", label: "People", icon: "👥" },
                { href: "/dashboard/admin/settings", label: "Settings", icon: "⚙️" },
            ],
        },
        {
            section: "Manager View",
            items: [
                { href: "/dashboard/manager/team", label: "My Team", icon: "🧑‍🤝‍🧑" },
                { href: "/dashboard/manager/approvals", label: "Approvals", icon: "✅" },
            ],
        },
    ],
    MANAGER: [
        {
            section: "Overview",
            items: [{ href: "/dashboard/manager", label: "Dashboard", icon: "📊" }],
        },
        {
            section: "Team",
            items: [
                { href: "/dashboard/manager/team", label: "My Team", icon: "🧑‍🤝‍🧑" },
                { href: "/dashboard/manager/approvals", label: "Approvals", icon: "✅" },
            ],
        },
    ],
    NEW_HIRE: [
        {
            section: "My Journey",
            items: [
                { href: "/dashboard/new-hire", label: "Timeline", icon: "🗓️" },
                { href: "/dashboard/new-hire/checkins", label: "Check-ins", icon: "💬" },
                { href: "/dashboard/new-hire/buddy", label: "My Buddy", icon: "🤝" },
            ],
        },
    ],
};

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = (session?.user as any)?.role || "NEW_HIRE";
    const name = session?.user?.name || "User";
    const sections = navConfig[role] || navConfig.NEW_HIRE;

    const roleLabels: Record<string, string> = {
        HR_ADMIN: "HR Administrator",
        MANAGER: "Manager",
        NEW_HIRE: "New Hire",
    };

    const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile header */}
            <div className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>First 90 Days</span>
            </div>

            {/* Mobile overlay */}
            <div
                className={`mobile-overlay ${mobileOpen ? "open" : ""}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">90</div>
                        <div>
                            <div className="sidebar-brand-text">First 90 Days</div>
                            <div className="sidebar-brand-sub">Onboarding Companion</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {sections.map((section) => (
                        <div key={section.section}>
                            <div className="sidebar-section-title">{section.section}</div>
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className="sidebar-link-icon">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="avatar avatar-sm">{initials}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{name}</div>
                            <div className="sidebar-user-role">{roleLabels[role] || role}</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ width: "100%", marginTop: "0.5rem" }}
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
