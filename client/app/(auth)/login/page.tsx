// app/(auth)/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  // TODO: replace with your API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      // await api.post("/auth/login", form)
      // store JWT in localStorage / cookie
      router.push("/dashboard")
    } catch {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* left panel — branding */}
      <div style={styles.leftPanel}>
        <div style={styles.gridOverlay} />
        <div style={styles.leftContent}>
          <span style={styles.logo}>
            <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
            <span style={{ color: "var(--accent)" }}>/&gt;</span>
          </span>
          <h2 style={styles.leftTitle}>
            Code review,<br />supercharged.
          </h2>
          <p style={styles.leftSub}>
            Paste code. Get inline AI comments on every suspicious line.
            Security issues, performance bugs, style problems — all flagged instantly.
          </p>

          {/* mini stat cards */}
          <div style={styles.statRow}>
            {[
              { val: "10+", label: "languages" },
              { val: "< 5s", label: "avg review" },
              { val: "100%", label: "private" },
            ].map(s => (
              <div key={s.label} style={styles.statCard}>
                <span style={styles.statVal}>{s.val}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* right panel — form */}
      <div style={styles.rightPanel}>
        <div style={styles.formWrap}>
          <h1 style={styles.formTitle}>Welcome back</h1>
          <p style={styles.formSub}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--accent)" }}>Sign up free</Link>
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p style={styles.errorMsg}>{error}</p>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── styles ──────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
  },
  leftPanel: {
    flex: 1,
    background: "var(--bg2)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    padding: "60px 56px",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,255,157,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,157,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  leftContent: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
    position: "relative",
    zIndex: 1,
    maxWidth: 420,
  },
  logo: {
    fontFamily: "var(--font-mono)",
    fontSize: 16,
    fontWeight: 600,
  },
  leftTitle: {
    fontFamily: "var(--font-sans)",
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 800,
    letterSpacing: "-1.5px",
    lineHeight: 1.1,
    color: "var(--text)",
  },
  leftSub: {
    fontSize: 15,
    color: "var(--muted)",
    lineHeight: 1.7,
    fontFamily: "var(--font-sans)",
  },
  statRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statCard: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 80,
  },
  statVal: {
    fontFamily: "var(--font-mono)",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--accent)",
  },
  statLabel: {
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    color: "var(--muted)",
  },

  // Right / form
  rightPanel: {
    width: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
  },
  formWrap: { width: "100%", maxWidth: 360 },
  formTitle: {
    fontFamily: "var(--font-sans)",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.8px",
    marginBottom: 8,
  },
  formSub: {
    fontSize: 14,
    color: "var(--muted)",
    marginBottom: 36,
    fontFamily: "var(--font-sans)",
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--muted)",
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  input: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)",
    padding: "11px 14px",
    fontSize: 14,
    fontFamily: "var(--font-mono)",
    outline: "none",
    width: "100%",
  },
  errorMsg: {
    fontSize: 13,
    color: "var(--red)",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "var(--radius)",
    padding: "9px 14px",
    fontFamily: "var(--font-mono)",
  },
  submitBtn: {
    background: "var(--accent)",
    border: "none",
    color: "#000",
    padding: "13px",
    borderRadius: "var(--radius)",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "var(--font-sans)",
    width: "100%",
    marginTop: 6,
    transition: "opacity 0.15s",
  },
}