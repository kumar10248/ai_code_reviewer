// app/(app)/review/[id]/page.tsx  — Review detail with diff viewer
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })
const DiffEditor   = dynamic(() => import("@monaco-editor/react").then(m => ({ default: m.DiffEditor })), { ssr: false })

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

// ── Mock data — replace with useEffect + API call ─────────────────
const MOCK_REVIEW = {
  _id: "1",
  language: "javascript",
  code: `async function getUser(id) {
  const query = \`SELECT * FROM users
    WHERE id = \${id}\`
  return db.query(query)
}

const cache = {}
function fetchData(url) {
  if (cache[url]) return cache[url]
  return fetch(url).then(r => r.json())
}`,
  aiSummary: "Found 2 critical issues: SQL injection on line 3 and unbounded cache growth on line 9. Recommend immediate fixes before deployment.",
  shareToken: null,
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
}

const MOCK_COMMENTS: Comment[] = [
  {
    _id: "c1",
    lineNumber: 3,
    severity: "error",
    category: "security",
    message: "SQL injection vulnerability. User input is directly interpolated into the query string.",
    suggestion: "Use parameterized queries:\ndb.query('SELECT * FROM users WHERE id = ?', [id])",
  },
  {
    _id: "c2",
    lineNumber: 9,
    severity: "warning",
    category: "performance",
    message: "Cache object grows unbounded. Every unique URL is stored forever, causing memory leaks.",
    suggestion: "Use a Map with max-size or an LRU cache:\nimport LRU from 'lru-cache'\nconst cache = new LRU({ max: 500 })",
  },
]

const SEV_COLOR: Record<Severity, string> = {
  error: "#f87171", warning: "#fbbf24", info: "#3b82f6"
}
const CAT_COLOR: Record<Category, string> = {
  security: "#f87171", performance: "#fb923c", style: "#818cf8", bug: "#fbbf24"
}

type ViewMode = "review" | "diff"

export default function ReviewDetailPage() {
  const router = useRouter()
  const [review]   = useState(MOCK_REVIEW)
  const [comments] = useState(MOCK_COMMENTS)
  const [active, setActive]       = useState<Comment | null>(null)
  const [viewMode, setViewMode]   = useState<ViewMode>("review")
  const [shareLoading, setShareLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)

  // Compose fixed code for diff view (replace problem lines with suggestion)
  const fixedCode = review.code
    .split("\n")
    .map((line, i) => {
      const comment = comments.find(c => c.lineNumber === i + 1)
      return comment ? `// FIXED: ${comment.suggestion.split("\n")[0]}` : line
    })
    .join("\n")

  const handleShare = async () => {
    setShareLoading(true)
    try {
      // TODO: const res = await api.post(`/reviews/${review._id}/share`)
      await new Promise(r => setTimeout(r, 800))
      const token = "mock-share-abc123"
      const link = `${window.location.origin}/share/${token}`
      setShareLink(link)
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={styles.root}>

      {/* ── TOP BAR ── */}
      <header style={styles.topBar}>
        <Link href="/dashboard" style={styles.backLink}>← Dashboard</Link>
        <span style={styles.logo}>
          <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
          <span style={{ color: "var(--accent)" }}>/&gt;</span>
        </span>

        {/* view toggle */}
        <div style={styles.toggle}>
          {(["review", "diff"] as ViewMode[]).map(m => (
            <button
              key={m}
              style={{
                ...styles.toggleBtn,
                background: viewMode === m ? "var(--bg3)" : "transparent",
                color:      viewMode === m ? "var(--text)" : "var(--muted)",
              }}
              onClick={() => setViewMode(m)}
            >
              {m === "review" ? "Review" : "Diff view"}
            </button>
          ))}
        </div>

        <button
          style={styles.shareBtn}
          onClick={handleShare}
          disabled={shareLoading}
        >
          {shareLoading ? "Generating..." : "⇗ Share"}
        </button>
      </header>

      {/* ── SHARE BANNER ── */}
      {shareLink && (
        <div style={styles.shareBanner}>
          <span style={styles.shareLinkText}>{shareLink}</span>
          <button style={styles.copyBtn} onClick={handleCopy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <button style={styles.closeBannerBtn} onClick={() => setShareLink(null)}>✕</button>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={styles.body}>

        {/* LEFT — editor or diff */}
        <div style={styles.editorWrap}>
          <div style={styles.editorBar}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {review.language} · {review.code.split("\n").length} lines
            </span>
            <span style={styles.commentCount}>
              {comments.length} issue{comments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {viewMode === "review" ? (
            <MonacoEditor
              height="100%"
              language={review.language}
              value={review.code}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                readOnly: true,
                lineHeight: 19,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          ) : (
            <DiffEditor
              height="100%"
              language={review.language}
              original={review.code}
              modified={fixedCode}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                readOnly: true,
                minimap: { enabled: false },
                renderSideBySide: true,
              }}
            />
          )}
        </div>

        {/* RIGHT — review details */}
        <div style={styles.rightPanel}>

          {/* Summary */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>// summary</div>
            <p style={styles.summaryText}>{review.aiSummary}</p>
          </div>

          {/* Inline comments */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>// {comments.length} issues found</div>
            <div style={styles.commentList}>
              {comments.map(c => (
                <div
                  key={c._id}
                  style={{
                    ...styles.commentCard,
                    borderColor: active?._id === c._id
                      ? SEV_COLOR[c.severity]
                      : "var(--border)",
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
                      <p style={styles.fixLabel}>// suggested fix</p>
                      <code style={styles.fixCode}>{c.suggestion}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>// meta</div>
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Reviewed</span>
              <span style={styles.metaVal}>
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Language</span>
              <span style={{ ...styles.metaVal, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                {review.language}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={styles.section}>
            <button
              style={styles.newReviewBtn}
              onClick={() => router.push("/review/new")}
            >
              + New review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" },
  topBar: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 20px", height: 52,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg2)", flexShrink: 0,
  },
  backLink: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" },
  logo: { fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, flex: 1, textAlign: "center" },
  toggle: {
    display: "flex",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    padding: "5px 12px", border: "none",
    borderRadius: 6, fontSize: 12,
    fontFamily: "var(--font-sans)", cursor: "pointer",
    transition: "all 0.15s",
  },
  shareBtn: {
    background: "rgba(0,255,157,0.1)",
    border: "1px solid rgba(0,255,157,0.25)",
    color: "var(--accent)",
    padding: "7px 16px",
    borderRadius: "var(--radius)",
    fontSize: 13, fontFamily: "var(--font-sans)",
    fontWeight: 600, cursor: "pointer",
    whiteSpace: "nowrap",
  },
  shareBanner: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 20px",
    background: "rgba(0,255,157,0.06)",
    borderBottom: "1px solid rgba(0,255,157,0.15)",
    flexShrink: 0,
  },
  shareLinkText: {
    fontFamily: "var(--font-mono)", fontSize: 12,
    color: "var(--accent)", flex: 1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  copyBtn: {
    background: "var(--accent)", border: "none", color: "#000",
    padding: "5px 14px", borderRadius: "var(--radius)",
    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: "pointer",
  },
  closeBannerBtn: {
    background: "transparent", border: "none",
    color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 0,
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
  section: { borderBottom: "1px solid var(--border)", padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
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
  metaRow:  { display: "flex", justifyContent: "space-between", alignItems: "center" },
  metaKey:  { fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-sans)" },
  metaVal:  { fontSize: 12, color: "var(--text)", fontFamily: "var(--font-mono)" },
  newReviewBtn: {
    background: "var(--accent)", border: "none", color: "#000",
    padding: "11px", borderRadius: "var(--radius)",
    fontSize: 14, fontWeight: 700, fontFamily: "var(--font-sans)",
    width: "100%", cursor: "pointer",
  },
}