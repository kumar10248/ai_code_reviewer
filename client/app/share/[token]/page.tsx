// app/share/[token]/page.tsx  — Public read-only shared review
// No auth required. Fetches via GET /api/share/:token
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

type Severity = "info" | "warning" | "error"
type Category = "security" | "performance" | "style" | "bug"

interface Comment {
  _id: string
  lineNumber: number
  severity: Severity
  category: Category
  message: string
  suggestion: string
}

interface Review {
  _id: string
  language: string
  code: string
  aiSummary: string
  shareExpiresAt: string
}

type LoadState = "loading" | "loaded" | "expired" | "error"

const SEV_COLOR: Record<Severity, string> = {
  error: "#f87171", warning: "#fbbf24", info: "#3b82f6"
}
const CAT_COLOR: Record<Category, string> = {
  security: "#f87171", performance: "#fb923c", style: "#818cf8", bug: "#fbbf24"
}

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return "Expired"
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `Expires in ${d}d`
  return `Expires in ${h}h`
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState]     = useState<LoadState>("loading")
  const [review, setReview]   = useState<Review | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [active, setActive]   = useState<Comment | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // TODO: replace with real API call
        // const res = await fetch(`/api/share/${token}`)
        // if (res.status === 404) { setState("expired"); return }
        // const data = await res.json()
        // setReview(data.review); setComments(data.comments); setState("loaded")

        // ── MOCK ──
        await new Promise(r => setTimeout(r, 900))
        setReview({
          _id: "1",
          language: "javascript",
          code: `async function getUser(id) {\n  const query = \`SELECT * FROM users WHERE id = \${id}\`\n  return db.query(query)\n}\n\nconst cache = {}\nfunction fetchData(url) {\n  if (cache[url]) return cache[url]\n  return fetch(url).then(r => r.json())\n}`,
          aiSummary: "Found 2 critical issues: SQL injection and unbounded cache growth. Shared for team review.",
          shareExpiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        })
        setComments([
          { _id: "c1", lineNumber: 2, severity: "error",   category: "security",    message: "SQL injection: user input interpolated directly into query.", suggestion: "db.query('SELECT * FROM users WHERE id = ?', [id])" },
          { _id: "c2", lineNumber: 8, severity: "warning", category: "performance", message: "Cache grows unbounded — memory leak risk.",                  suggestion: "Use LRU cache with max size limit." },
        ])
        setState("loaded")
      } catch {
        setState("error")
      }
    }
    load()
  }, [token])

  // ── Loading ──────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div style={styles.center}>
        <div style={styles.spinnerLg} />
        <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          Loading shared review...
        </p>
      </div>
    )
  }

  // ── Expired / error ──────────────────────────────────────────
  if (state === "expired" || state === "error") {
    return (
      <div style={styles.center}>
        <div style={styles.errorIcon}>
          {state === "expired" ? "⏱" : "✕"}
        </div>
        <h1 style={styles.errorTitle}>
          {state === "expired" ? "Link expired" : "Something went wrong"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", maxWidth: 340 }}>
          {state === "expired"
            ? "This shared review link has expired or doesn't exist."
            : "We couldn't load this review. The link may be invalid."}
        </p>
        <Link href="/" style={styles.homeLink}>← Back to ReviewAI</Link>
      </div>
    )
  }

  // ── Loaded ───────────────────────────────────────────────────
  return (
    <div style={styles.root}>

      {/* ── TOP BAR ── */}
      <header style={styles.topBar}>
        <Link href="/" style={styles.logo}>
          <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
          <span style={{ color: "var(--accent)" }}>/&gt;</span>
        </Link>

        <div style={styles.readOnlyBadge}>
          <span style={{ color: "var(--muted)", fontSize: 10 }}>●</span>
          Read-only shared view
        </div>

        {review && (
          <span style={styles.expiryBadge}>
            {timeLeft(review.shareExpiresAt)}
          </span>
        )}

        <Link href="/register" style={styles.ctaLink}>
          Try ReviewAI free →
        </Link>
      </header>

      {/* ── BODY ── */}
      <div style={styles.body}>

        {/* LEFT — read-only editor */}
        <div style={styles.editorWrap}>
          <div style={styles.editorBar}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {review?.language} · read-only
            </span>
            <span style={styles.commentCount}>
              {comments.length} issue{comments.length !== 1 ? "s" : ""}
            </span>
          </div>

          <MonacoEditor
            height="100%"
            language={review?.language}
            value={review?.code}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              readOnly: true,
              lineHeight: 19,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              domReadOnly: true,
              contextmenu: false,
            }}
          />
        </div>

        {/* RIGHT — review panel */}
        <div style={styles.rightPanel}>

          {/* Shared by / watermark */}
          <div style={styles.sharedBanner}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)" }}>
              ⇗ shared review
            </span>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              This is a read-only view shared via link.
            </p>
          </div>

          {/* Summary */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>// summary</div>
            <p style={styles.summaryText}>{review?.aiSummary}</p>
          </div>

          {/* Comments */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>// {comments.length} issues</div>
            <div style={styles.commentList}>
              {comments.map(c => (
                <div
                  key={c._id}
                  style={{
                    ...styles.commentCard,
                    borderColor: active?._id === c._id ? SEV_COLOR[c.severity] : "var(--border)",
                  }}
                  onClick={() => setActive(prev => prev?._id === c._id ? null : c)}
                >
                  <div style={styles.commentTop}>
                    <span style={{
                      ...styles.sevBadge,
                      color: SEV_COLOR[c.severity],
                      background: `${SEV_COLOR[c.severity]}15`,
                      borderColor: `${SEV_COLOR[c.severity]}30`,
                    }}>
                      {c.severity}
                    </span>
                    <span style={{
                      ...styles.catBadge,
                      color: CAT_COLOR[c.category],
                      background: `${CAT_COLOR[c.category]}15`,
                      borderColor: `${CAT_COLOR[c.category]}30`,
                    }}>
                      {c.category}
                    </span>
                    <span style={styles.lineRef}>line {c.lineNumber}</span>
                  </div>
                  <p style={styles.commentMsg}>{c.message}</p>
                  {active?._id === c._id && (
                    <div style={styles.fixBox}>
                      <p style={styles.fixLabel}>// fix</p>
                      <code style={styles.fixCode}>{c.suggestion}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={styles.section}>
            <div style={styles.ctaCard}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>
                Want AI code reviews for your own code?
              </p>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                Free account. No credit card. Review any language in seconds.
              </p>
              <Link href="/register" style={styles.ctaBtn}>
                Get started free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // full-screen states
  center: {
    minHeight: "100vh", background: "var(--bg)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 20,
  },
  spinnerLg: {
    width: 36, height: 36,
    border: "3px solid var(--border2)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  errorIcon: { fontSize: 40, color: "var(--muted)" },
  errorTitle: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" },
  homeLink: {
    fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent)",
    padding: "8px 20px", border: "1px solid rgba(0,255,157,0.25)",
    borderRadius: "var(--radius)", background: "rgba(0,255,157,0.06)",
  },

  // main layout
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" },
  topBar: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "0 20px", height: 52,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg2)", flexShrink: 0,
  },
  logo: { fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600 },
  readOnlyBadge: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)",
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: 20, padding: "3px 10px",
  },
  expiryBadge: {
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)",
    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
    borderRadius: 20, padding: "3px 10px",
  },
  ctaLink: {
    marginLeft: "auto",
    background: "var(--accent)", color: "#000",
    padding: "7px 16px", borderRadius: "var(--radius)",
    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
  },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  editorWrap: {
    flex: 1, display: "flex", flexDirection: "column",
    borderRight: "1px solid var(--border)", overflow: "hidden",
  },
  editorBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 16px", borderBottom: "1px solid var(--border)",
    background: "var(--bg3)", flexShrink: 0,
  },
  commentCount: {
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)",
    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 4, padding: "2px 8px",
  },
  rightPanel: { width: 340, overflowY: "auto", flexShrink: 0, background: "var(--bg)" },
  sharedBanner: {
    padding: "12px 16px",
    background: "rgba(0,255,157,0.04)",
    borderBottom: "1px solid rgba(0,255,157,0.1)",
    display: "flex", flexDirection: "column", gap: 4,
  },
  section: { borderBottom: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  sectionLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" },
  summaryText: { fontSize: 13, color: "var(--muted)", lineHeight: 1.65, fontFamily: "var(--font-sans)" },
  commentList: { display: "flex", flexDirection: "column", gap: 8 },
  commentCard: {
    background: "var(--bg2)", border: "1px solid",
    borderRadius: "var(--radius)", padding: "12px 14px",
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
    transition: "border-color 0.15s",
  },
  commentTop: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  sevBadge: { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, border: "1px solid" },
  catBadge: { fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 7px", borderRadius: 4, border: "1px solid" },
  lineRef:  { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginLeft: "auto" },
  commentMsg: { fontSize: 12, color: "var(--muted)", lineHeight: 1.55, fontFamily: "var(--font-sans)" },
  fixBox: { background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 },
  fixLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)" },
  fixCode:  { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  ctaCard: {
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "18px",
  },
  ctaBtn: {
    display: "block", textAlign: "center",
    background: "var(--accent)", color: "#000",
    padding: "10px", borderRadius: "var(--radius)",
    fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans)",
  },
}