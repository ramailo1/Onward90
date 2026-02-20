"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "neutral" | "primary";
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            // Prevent scrolling when modal is open
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setVisible(false), 300); // Wait for animation
            document.body.style.overflow = "";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;
    if (!visible && !isOpen) return null;

    const backdropClass = isOpen ? "opacity-100" : "opacity-0";
    const modalClass = isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0";

    const confirmBtnClass =
        variant === "danger"
            ? "btn-danger"
            : variant === "primary"
                ? "btn-primary"
                : "btn-secondary";

    const content = (
        <div
            className={`fixed inset-0 z-modal flex items-center justify-center p-4 transition-opacity duration-300 ${backdropClass}`}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                transition: "opacity 0.2s ease-out",
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? "auto" : "none",
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(2px)",
                }}
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className="card shadow-xl"
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "400px",
                    background: "var(--color-white)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-xl)",
                    padding: "1.5rem",
                    transform: isOpen ? "scale(1)" : "scale(0.95)",
                    opacity: isOpen ? 1 : 0,
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                <h3
                    style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        color: "var(--color-gray-900)",
                        marginBottom: "0.5rem",
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        fontSize: "0.875rem",
                        color: "var(--color-gray-500)",
                        lineHeight: 1.5,
                        marginBottom: "1.5rem",
                    }}
                >
                    {description}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn ${confirmBtnClass}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
