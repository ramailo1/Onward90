import Link from "next/link";

export default function HomePage() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <span style={styles.navLogo}>90</span>
          <span style={styles.navTitle}>First 90 Days</span>
        </div>
        <Link href="/login" className="btn btn-primary">
          Sign In
        </Link>
      </nav>

      <main style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>🚀 Onboarding that actually works</div>
          <h1 style={styles.heroTitle}>
            Make Every New Hire&apos;s
            <br />
            <span style={styles.heroGradient}>First 90 Days</span> Count
          </h1>
          <p style={styles.heroDesc}>
            A structured day-by-day onboarding companion that helps new hires
            ramp up faster, keeps managers informed, and gives HR full
            visibility. Because <strong>82% better retention</strong> starts
            with a great first experience.
          </p>
          <div style={styles.heroCTA}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Get Started →
            </Link>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <div style={styles.statNum}>90</div>
              <div style={styles.statLabel}>Days of structured guidance</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <div style={styles.statNum}>4</div>
              <div style={styles.statLabel}>Wellness check-ins</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <div style={styles.statNum}>3</div>
              <div style={styles.statLabel}>Role-based views</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <div style={styles.statNum}>82%</div>
              <div style={styles.statLabel}>Better retention (industry avg)</div>
            </div>
          </div>
        </div>

        <div style={styles.features}>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>🌱</div>
            <h3 style={styles.featureTitle}>New Hire Timeline</h3>
            <p style={styles.featureDesc}>
              Day-by-day tasks, buddy info, and progress tracking. Know exactly
              what to do and when.
            </p>
          </div>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>👤</div>
            <h3 style={styles.featureTitle}>Manager Dashboard</h3>
            <p style={styles.featureDesc}>
              See your team&apos;s progress, assign buddies, approve milestones,
              and catch issues early.
            </p>
          </div>
          <div className="card" style={styles.featureCard}>
            <div style={styles.featureIcon}>🏢</div>
            <h3 style={styles.featureTitle}>HR Command Center</h3>
            <p style={styles.featureDesc}>
              Create templates, monitor cohorts, export reports, and ensure
              nothing falls through the cracks.
            </p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>&copy; 2026 First 90 Days. Built to make onboarding a competitive advantage.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, #f0fdfa 0%, #ffffff 40%)",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  navLogo: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#0d9488",
    letterSpacing: "-1px",
  },
  navTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "#111827",
  },
  hero: {
    flex: 1,
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    padding: "3rem 2rem",
  },
  heroContent: {
    textAlign: "center" as const,
    marginBottom: "4rem",
  },
  heroBadge: {
    display: "inline-block",
    padding: "0.375rem 1rem",
    background: "#ccfbf1",
    color: "#0f766e",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.1",
    marginBottom: "1.5rem",
    letterSpacing: "-1.5px",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #0d9488, #6366f1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroDesc: {
    fontSize: "1.125rem",
    color: "#6b7280",
    lineHeight: "1.75",
    maxWidth: "640px",
    margin: "0 auto 2rem",
  },
  heroCTA: {
    marginBottom: "3rem",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "2rem",
    flexWrap: "wrap" as const,
  },
  statItem: {
    textAlign: "center" as const,
  },
  statNum: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#0d9488",
    lineHeight: "1.2",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    maxWidth: "120px",
  },
  statDivider: {
    width: "1px",
    height: "40px",
    background: "#e5e7eb",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  featureCard: {
    textAlign: "center" as const,
    padding: "2rem",
  },
  featureIcon: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  featureTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "0.5rem",
  },
  featureDesc: {
    fontSize: "0.875rem",
    color: "#6b7280",
    lineHeight: "1.6",
  },
  footer: {
    textAlign: "center" as const,
    padding: "2rem",
    fontSize: "0.8rem",
    color: "#9ca3af",
    borderTop: "1px solid #f3f4f6",
  },
};
