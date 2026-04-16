// app/(app)/review/new/page.tsx
// Note: install @monaco-editor/react  →  npm i @monaco-editor/react
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────
type Severity = "info" | "warning" | "error"
type Category = "security" | "performance" | "style" | "bug"

interface InlineComment {
  lineNumber: number
  severity: Severity
  category: Category
  message: string
  suggestion: string
}

type Status = "idle" | "streaming" | "done" | "error"

const SEV_COLOR: Record<Severity, string> = {
  error:   "#f87171",
  warning: "#fbbf24",
  info:    "#3b82f6",
}
const CAT_COLOR: Record<Category, string> = {
  security:    "#f87171",
  performance: "#fb923c",
  style:       "#818cf8",
  bug:         "#fbbf24",
}

const LANG_OPTIONS = [
  "javascript","typescript","python","java","go","rust","cpp","php","unknown"
]

export default function NewReviewPage() {
  const router = useRouter()
  const [code, setCode]               = useState("// Paste your code here...\n")
  const [language, setLanguage]       = useState("javascript")
  const [status, setStatus]           = useState<Status>("idle")
  const [summary, setSummary]         = useState("")
  const [comments, setComments]       = useState<InlineComment[]>([])
  const [activeComment, setActive]    = useState<InlineComment | null>(null)
  const [streamText, setStreamText]   = useState("")
  const summaryRef                    = useRef<HTMLDivElement>(null)

  // ── Submit handler — wire your SSE here ──
  const handleSubmit = async () => {
    if (!code.trim() || code === "// Paste your code here...\n") return
    setStatus("streaming")
    setSummary("")
    setComments([])
    setStreamText("")

    try {
      // TODO: replace with your real SSE call
      // const res = await fetch("/api/reviews", { method:"POST", body: JSON.stringify({code}), headers: {...} })
      // const reader = res.body!.getReader()
      // ... read SSE stream, call setStreamText on each token, parse final JSON

      // ── MOCK streaming for UI demo ──
      const mockSummary = "Found 2 critical issues: SQL injection on line 3 and unbounded cache growth on line 9. Recommend immediate fixes before deployment."
      for (let i = 0; i < mockSummary.length; i++) {
        await new Promise(r => setTimeout(r, 18))
        setStreamText(mockSummary.slice(0, i + 1))
        summaryRef.current?.scrollTo(0, summaryRef.current.scrollHeight)
      }
      setSummary(mockSummary)
      setComments([
        { lineNumber: 3, severity: "error",   category: "security",    message: "SQL injection vulnerability. User input is directly interpolated into the query string.",       suggestion: "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [id])" },
        { lineNumber: 9, severity: "warning", category: "performance", message: "Cache object grows unbounded. Every unique URL is stored forever, causing memory leaks.",       suggestion: "Use a Map with a max-size limit or an LRU cache library like `lru-cache`." },
      ])
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setSummary("")
    setComments([])
    setStreamText("")
    setActive(null)
  }

  // ── Line decorator: highlight lines with comments in Monaco
  const commentLines = new Set(comments.map(c => c.lineNumber))

  return (
    <div style={styles.root}>

      {/* ── TOP BAR ── */}
      <header style={styles.topBar}>
        <Link href="/dashboard" style={styles.backLink}>← Dashboard</Link>
        <span style={styles.logo}>
          <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
          <span style={{ color: "var(--accent)" }}>/&gt;</span>
        </span>

        <div style={styles.topRight}>
          {/* language selector */}
          <select
            style={styles.select}
            value={language}
            onChange={e => setLanguage(e.target.value)}
            disabled={status === "streaming"}
          >
            {LANG_OPTIONS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {status === "idle" || status === "error" ? (
            <button style={styles.reviewBtn} onClick={handleSubmit}>
              Review code →
            </button>
          ) : status === "streaming" ? (
            <button style={{ ...styles.reviewBtn, opacity: 0.6 }} disabled>
              <span style={styles.spinner} /> Reviewing...
            </button>
          ) : (
            <button style={styles.resetBtn} onClick={handleReset}>
              + New review
            </button>
          )}
        </div>
      </header>

      {/* ── BODY: editor + panel ── */}
      <div style={styles.body}>

        {/* LEFT — Monaco code editor */}
        <div style={styles.editorWrap}>
          <div style={styles.editorBar}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {language} · {code.split("\n").length} lines
            </span>
            {status === "done" && (
              <span style={styles.commentCount}>
                {comments.length} issue{comments.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>

          {/* Gutter annotation overlay — shown above Monaco */}
          <div style={styles.gutterOverlay}>
            {comments.map(c => (
              <div
                key={c.lineNumber}
                style={{
                  ...styles.gutterPin,
                  top: (c.lineNumber - 1) * 19 + 6,   // 19px = Monaco line height
                }}
                onClick={() => setActive(active => active?.lineNumber === c.lineNumber ? null : c)}
                title={c.message}
              >
                <span style={{ color: SEV_COLOR[c.severity], fontSize: 10 }}>●</span>
              </div>
            ))}
          </div>

          <MonacoEditor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            value={code}
            onChange={v => { if (status === "idle") setCode(v || "") }}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineHeight: 19,
              padding: { top: 12, bottom: 12 },
              readOnly: status !== "idle",
              renderLineHighlight: "line",
              lineNumbers: "on",
              glyphMargin: true,
            }}
          />
        </div>

        {/* RIGHT — Review panel */}
        <div style={styles.rightPanel}>

          {/* Summary */}
          <div style={styles.panelSection}>
            <div style={styles.panelLabel}>// ai summary</div>
            <div ref={summaryRef} style={styles.summaryBox}>
              {status === "idle" && (
                <p style={styles.placeholder}>
                  Submit your code and the AI review will stream here in real time.
                </p>
              )}
              {(status === "streaming" || status === "done") && (
                <p style={styles.summaryText}>
                  {streamText}
                  {status === "streaming" && <span style={styles.cursor} />}
                </p>
              )}
              {status === "error" && (
                <p style={{ ...styles.placeholder, color: "var(--red)" }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>

          {/* Inline comments list */}
          {comments.length > 0 && (
            <div style={styles.panelSection}>
              <div style={styles.panelLabel}>// {comments.length} issues</div>
              <div style={styles.commentList}>
                {comments.map(c => (
                  <div
                    key={c.lineNumber}
                    style={{
                      ...styles.commentCard,
                      borderColor: activeComment?.lineNumber === c.lineNumber
                        ? SEV_COLOR[c.severity]
                        : "var(--border)",
                    }}
                    onClick={() => setActive(prev =>
                      prev?.lineNumber === c.lineNumber ? null : c
                    )}
                  >
                    {/* header row */}
                    <div style={styles.commentHeader}>
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

                    {/* expanded suggestion */}
                    {activeComment?.lineNumber === c.lineNumber && (
                      <div style={styles.suggestion}>
                        <p style={styles.suggestionLabel}>Suggested fix:</p>
                        <code style={styles.suggestionCode}>{c.suggestion}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share button — only shown after review is done */}
          {status === "done" && (
            <div style={styles.panelSection}>
              <button
                style={styles.shareBtn}
                onClick={() => {
                  // TODO: api.post(`/reviews/${reviewId}/share`) then copy link
                  alert("Share link generated! (wire your API here)")
                }}
              >
                ⇗ Generate share link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline comment popover ── */}
      {activeComment && (
        <div style={styles.popover}>
          <div style={styles.popoverHeader}>
            <span style={{ color: SEV_COLOR[activeComment.severity], fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {activeComment.severity.toUpperCase()} · {activeComment.category} · line {activeComment.lineNumber}
            </span>
            <button style={styles.popoverClose} onClick={() => setActive(null)}>✕</button>
          </div>
          <p style={styles.popoverMsg}>{activeComment.message}</p>
          <div style={styles.popoverFix}>
            <p style={styles.suggestionLabel}>Fix:</p>
            <code style={styles.suggestionCode}>{activeComment.suggestion}</code>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "var(--bg)",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "0 24px",
    height: 52,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg2)",
    flexShrink: 0,
  },
  backLink: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--muted)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    fontWeight: 600,
    flex: 1,
    textAlign: "center",
  },
  topRight: { display: "flex", gap: 10, alignItems: "center" },
  select: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    padding: "6px 10px",
    borderRadius: "var(--radius)",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    outline: "none",
    cursor: "pointer",
  },
  reviewBtn: {
    background: "var(--accent)",
    border: "none",
    color: "#000",
    padding: "8px 18px",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "var(--font-sans)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    padding: "8px 18px",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
  },
  spinner: {
    width: 12,
    height: 12,
    border: "2px solid #00000040",
    borderTopColor: "#000",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.6s linear infinite",
  },

  // Body
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },

  // Editor
  editorWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid var(--border)",
    position: "relative",
    overflow: "hidden",
  },
  editorBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg3)",
    flexShrink: 0,
  },
  commentCount: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--yellow)",
    background: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 4,
    padding: "2px 8px",
  },
  gutterOverlay: {
    position: "absolute",
    left: 0,
    top: 42,  // below editorBar
    width: 36,
    zIndex: 10,
    pointerEvents: "none",
  },
  gutterPin: {
    position: "absolute",
    left: 6,
    width: 14,
    height: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    pointerEvents: "all",
  },

  // Right panel
  rightPanel: {
    width: 340,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexShrink: 0,
    background: "var(--bg)",
  },
  panelSection: {
    borderBottom: "1px solid var(--border)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  panelLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--accent)",
    letterSpacing: "0.05em",
  },
  summaryBox: {
    minHeight: 80,
    maxHeight: 160,
    overflowY: "auto",
  },
  placeholder: {
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.6,
    fontFamily: "var(--font-sans)",
  },
  summaryText: {
    fontSize: 13,
    color: "var(--text)",
    lineHeight: 1.65,
    fontFamily: "var(--font-sans)",
  },
  cursor: {
    display: "inline-block",
    width: 7,
    height: 13,
    background: "var(--accent)",
    borderRadius: 1,
    marginLeft: 2,
    verticalAlign: "middle",
    animation: "blink 1s step-end infinite",
  },

  // Comment list
  commentList: { display: "flex", flexDirection: "column", gap: 8 },
  commentCard: {
    background: "var(--bg2)",
    border: "1px solid",
    borderRadius: "var(--radius)",
    padding: "12px 14px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "border-color 0.15s",
  },
  commentHeader: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  sevBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 7px",
    borderRadius: 4,
    border: "1px solid",
  },
  catBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    padding: "1px 7px",
    borderRadius: 4,
    border: "1px solid",
  },
  lineRef: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--muted)",
    marginLeft: "auto",
  },
  commentMsg: {
    fontSize: 12,
    color: "var(--muted)",
    lineHeight: 1.55,
    fontFamily: "var(--font-sans)",
  },
  suggestion: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  suggestionLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--accent)",
  },
  suggestionCode: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  shareBtn: {
    background: "rgba(0,255,157,0.08)",
    border: "1px solid rgba(0,255,157,0.25)",
    color: "var(--accent)",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },

  // Popover
  popover: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--bg2)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
    width: 420,
    maxWidth: "90vw",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  popoverHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  popoverClose: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
  },
  popoverMsg: {
    fontSize: 13,
    color: "var(--text)",
    lineHeight: 1.6,
    fontFamily: "var(--font-sans)",
  },
  popoverFix: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
}