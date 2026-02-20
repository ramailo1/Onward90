import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "First 90 Days — Onboarding Companion",
  description:
    "A structured 90-day onboarding experience that helps new hires ramp up faster, managers stay informed, and HR track success.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
