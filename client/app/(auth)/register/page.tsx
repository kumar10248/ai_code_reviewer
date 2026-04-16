// app/(auth)/register/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  // TODO: replace with your API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    try {
      // await api.post("/auth/register", form)
      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.gridOverlay} />
        <div style={styles.leftContent}>
          <Link href="/" style={styles.logo}>
            <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
            <span style={{ color: "var(--accent)" }}>/&gt;</span>
          </Link>
          <h2 style={styles.leftTitle}>Start reviewing smarter.</h2>
          <div style={styles.stepList}>
            {[
              "Create your free account",
              "Paste any code in any language",
              "Get inline AI review in seconds",
              "Share with your team via link",
            ].map((step, i) => (
              <div key={i} style={styles.step}>
                <span style={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <span style={styles.stepText}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* right panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formWrap}>
          <h1 style={styles.formTitle}>Create account</h1>
          <p style={styles.formSub}>
            Already have one?{" "}
            <Link href="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              {/* password strength indicator */}
              <div style={styles.strengthBar}>
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    style={{
                      ...styles.strengthSegment,
                      background:
                        form.password.length >= n * 3
                          ? n <= 1 ? "var(--red)"
                          : n <= 2 ? "var(--orange)"
                          : n <= 3 ? "var(--yellow)"
                          : "var(--accent)"
                          : "var(--border)",
                    }}
                  />
                ))}
              </div>
            </div>

            {error && <p style={styles.errorMsg}>{error}</p>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>

            <p style={styles.terms}>
              By signing up you agree to our{" "}
              <span style={{ color: "var(--muted)", textDecoration: "underline", cursor: "pointer" }}>
                terms of service
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh", background: "var(--bg)" },
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
    gap: 32,
    position: "relative",
    zIndex: 1,
    maxWidth: 420,
  },
  logo: {
    fontFamily: "var(--font-mono)",
    fontSize: 16,
    fontWeight: 600,
    display: "inline-block",
  },
  leftTitle: {
    fontFamily: "var(--font-sans)",
    fontSize: "clamp(26px, 3.5vw, 40px)",
    fontWeight: 800,
    letterSpacing: "-1.2px",
    lineHeight: 1.1,
  },
  stepList: { display: "flex", flexDirection: "column", gap: 14 },
  step: { display: "flex", gap: 14, alignItems: "flex-start" },
  stepNum: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--accent)",
    fontWeight: 600,
    marginTop: 2,
    minWidth: 24,
  },
  stepText: {
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  rightPanel: {
    width: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
  },
  formWrap: { width: "100%", maxWidth: 360 },
  formTitle: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.8px",
    marginBottom: 8,
    fontFamily: "var(--font-sans)",
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
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontFamily: "var(--font-sans)",
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
  strengthBar: { display: "flex", gap: 4, marginTop: 6 },
  strengthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    transition: "background 0.3s",
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
    marginTop: 4,
    transition: "opacity 0.15s",
  },
  terms: {
    fontSize: 12,
    color: "var(--muted)",
    textAlign: "center",
    fontFamily: "var(--font-sans)",
  },
}